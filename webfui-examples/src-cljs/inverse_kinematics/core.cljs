(ns webfui-examples.inverse-kinematics.core
  (:use [webfui.framework :only [launch-app]])
  (:use-macros [webfui.framework.macros :only [add-mouse-watch]]))

(defn average [& numbers]
  (/ (apply + numbers) (count numbers)))

(defn average-points [& points]
  [(apply average (map first points)) (apply average (map second points))])

(defn translate [[tx ty] [x y]]
  [(+ x tx) (+ y ty)])

(defn segment-angle [[x1 y1] [x2 y2]]
  (js/Math.atan2 (- y1 y2) (- x2 x1)))

(defn sqr [x]
  (* x x))

(defn distance-squared [[x1 y1] [x2 y2]]
  (+ (sqr (- x1 x2)) (sqr (- y1 y2))))

(defn distance [[x1 y1] [x2 y2]]
  (js/Math.sqrt (+ (sqr (- x1 x2)) (sqr (- y1 y2)))))

(defn normalize-angle [ang]
  (let [p js/Math.PI
        p2 (* p 2)]
    (cond (< ang (- p)) (normalize-angle (+ ang p2))
          (>= ang p) (normalize-angle (- ang p2))
          :else ang)))

(defn angle-delta [angle-1 angle-2]
  (let [angle (normalize-angle (- angle-1 angle-2))]
    (if (<= angle js/Math.PI)
      angle
      (- (* js/Math.PI 2) angle))))

(defn move-point [[x y] angle dist]
  [(+ x (* (js/Math.cos angle) dist)) (- y (* (js/Math.sin angle) dist))])

(defn negative-point [[x y]]
  [(- x) (- y)])

(defn dynamic-goal-tree [tree]
  (let [[type from-point & rest] tree]
    (case type
          :branch (let [to-point (apply average-points (map second rest))
                        angle (segment-angle from-point to-point)]
                    {:from-point from-point
                     :to-point to-point
                     :children (for [child rest]
                                 (let [[_ from-point-child] child
                                       angle-child (segment-angle from-point from-point-child)
                                       dist-child (distance from-point from-point-child)
                                       relative-angle (normalize-angle (- angle-child angle))]
                                   (assoc (dynamic-goal-tree child)
                                     :relative-angle relative-angle
                                     :distance dist-child)))})
          :leaf {:from-point from-point
                 :to-point (first rest)})))

(defn static-goal-tree [tree]
  (let [{:keys [from-point to-point children]} tree]
    (if (seq children)
      (concat [:branch from-point]
              (map static-goal-tree children))
      [:leaf from-point to-point])))

(defn procrustes [& point-vectors]
  (let [corrected-points (for [points point-vectors]
                           (let [[cx cy] (average-points points)
                                 translated (map (partial translate [(- cx) (- cy)]) points)
                                 scale (js/Math.sqrt (apply average (map (partial distance-squared [0 0]) translated)))]
                             (for [[x y] translated]
                               [(/ x scale) (/ y scale)])))
        totals (for [[[x y] [w z]] (apply map vector corrected-points)]
                 [(- (* w y) (* z x)) (+ (* w x) (* z y))])
        numerator (apply + (map first totals))
        denominator (apply + (map second totals))]
    (js/Math.atan2 numerator denominator)))

(defn anneal-step [depth dtree goal-from-point]
  (let [{:keys [from-point to-point children]} dtree]
    (if (and (pos? depth) (> (distance-squared from-point goal-from-point) 0.0001))
      (let [dist (distance from-point to-point)
            too-close (< dist 40)
            angle (segment-angle from-point to-point)
            angle-new (if too-close
                        angle
                        (segment-angle goal-from-point to-point))
            delta (angle-delta angle angle-new)
            child-count (count children)]
        (if (and (> delta 0.01) (<= child-count 1))
          (assoc dtree :from-point (move-point to-point (+ angle-new js/Math.PI) dist))
          (let [points (for [child children]
                         (let [{:keys [relative-angle distance]} child]
                           (move-point goal-from-point (+ angle-new relative-angle) distance)))
                children-new (map (partial anneal-step (dec depth)) children points)
                points-new (map :from-point children-new)
                to-point-new (if (zero? child-count)
                               (move-point goal-from-point angle-new dist)
                               (apply average-points points-new))
                angle-back (if too-close
                             (+ angle js/Math.PI)
                             (segment-angle to-point-new goal-from-point))
                from-point-back (move-point to-point-new
                                            (if (<= 1 child-count)
                                              angle-back
                                              (+ angle-back (procrustes points points-new)) dist) 
                                            dist)]
            (assoc dtree
              :from-point from-point-back
              :to-point to-point-new
              :children children-new))))
      dtree)))

(defn anneal [dtree goal-from-point]
  (let [breadth-first (if (and (= (count (:children dtree)) 1) (= (count (:children (first (:children dtree)))) 1))
                        (reduce (fn [acc n]
                                  (let [{:keys [from-point]} acc]
                                    (anneal-step 2
                                                 acc
                                                 goal-from-point)))
                                dtree
                                (range 30))
                        dtree)
        increasing-stability (reduce (fn [acc n]
                                       (let [{:keys [from-point]} acc]
                                         (anneal-step 1000
                                                      acc
                                                      (cond (< n 10) goal-from-point
                                                            (< n 20) (average-points from-point goal-from-point)
                                                            :else from-point))))
                                     breadth-first
                                     (range 30))]
    increasing-stability))

#_(def initial-state {:tree (dynamic-goal-tree [:branch [50 50]
                                                [:leaf [100 100] [160 140]]])})

#_(def initial-state {:tree (dynamic-goal-tree [:branch [50 50]
                                                [:leaf [110 90] [160 140]]
                                                [:branch [:leaf [120,200] [200,200]]]])})

(defn connect-pinholes [skeleton]
  (assoc skeleton
    :boxes
    (let [{:keys [boxes pins]} skeleton]
      (reduce (fn [boxes pin]
                (let [[[box-from-index pin-from-index] [box-to-index pin-to-index]] pin]
                  (update-in boxes
                             [box-to-index :pinholes pin-to-index]
                             (fn [_]
                               (let [box-from (boxes box-from-index)
                                     pin-from ((:pinholes box-from) pin-from-index)
                                     box-to (boxes box-to-index)
                                     {:keys [left top]} box-to]
                                 [(- (+ (:left box-from) (first pin-from)) left) (- (+ (:top box-from) (second pin-from)) top)])))))
              boxes
              pins))))

#_(def initial-state {:skeleton {:boxes [{:left 50
                                          :top 50
                                          :width 50
                                          :height 150
                                          :color :red
                                          :pinholes [[37 137]]
                                          :angle 0
                                          }
                                         {:left 75
                                          :top 175
                                          :width 50
                                          :height 125
                                          :color :blue
                                          :pinholes [[12 12]]
                                          :angle 0}]
                                 :pins [[[0 0] [1 0]]]}}) 

(def initial-state {:skeleton (connect-pinholes {:boxes [{:left 400
                                                          :top 50
                                                          :width 80
                                                          :height 150
                                                          :color :red
                                                          :pinholes [[40 140]]
                                                          :angle 0}
                                                         {:left 350
                                                          :top 175
                                                          :width 180
                                                          :height 250
                                                          :color :blue
                                                          :pinholes [nil nil nil nil nil]
                                                          :angle 0}
                                                         {:left 200
                                                          :top 175
                                                          :width 180
                                                          :height 50
                                                          :color :green
                                                          :pinholes [[170 25] nil]
                                                          :angle 0}
                                                         {:left 80
                                                          :top 180
                                                          :width 140
                                                          :height 40
                                                          :color :yellow
                                                          :pinholes [[135 20]]
                                                          :angle 0}
                                                         {:left 500
                                                          :top 175
                                                          :width 180
                                                          :height 50
                                                          :color :orange
                                                          :pinholes [[10 25] nil]
                                                          :angle 0}
                                                         {:left 660
                                                          :top 180
                                                          :width 140
                                                          :height 40
                                                          :color :purple
                                                          :pinholes [[10 20]]
                                                          :angle 0}
                                                         {:left 350
                                                          :top 400
                                                          :width 70
                                                          :height 160
                                                          :color :grey
                                                          :pinholes [[35 10] nil]
                                                          :angle 0}
                                                         {:left 460
                                                          :top 400
                                                          :width 70
                                                          :height 160
                                                          :color :red
                                                          :pinholes [[35 10] nil]
                                                          :angle 0}
                                                         {:left 360
                                                          :top 540
                                                          :width 50
                                                          :height 140
                                                          :color :purple
                                                          :pinholes [[35 10]]
                                                          :angle 0}
                                                         {:left 470
                                                          :top 540
                                                          :width 50
                                                          :height 140
                                                          :color :green
                                                          :pinholes [[35 10]]
                                                          :angle 0}
                                                         {:left 700
                                                          :top 30
                                                          :width 100
                                                          :height 100
                                                          :color :black
                                                          :pinholes []
                                                          :angle 0
                                                          }
                                                         
                                                         ]
                                                 :pins [[[0 0] [1 0]]
                                                        [[2 0] [1 1]]
                                                        [[3 0] [2 1]]
                                                        [[4 0] [1 2]]
                                                        [[5 0] [4 1]]
                                                        [[6 0] [1 3]]
                                                        [[7 0] [1 4]]
                                                        [[8 0] [6 1]]
                                                        [[9 0] [7 1]]
                                                        ]})})

(defn pin-positions [pins]
  (into {}
        (concat pins (map (comp vec reverse) pins))))

(defn counterpoint [width height point]
  (let [[x y] point
        cx (/ width 2)
        cy (/ height 2)]
    (cond (or (> (js/Math.abs (- x cx)) (/ cx 2)) (> (js/Math.abs (- y cy)) (/ cy 2))) [(- width x) (- height y)]
          (and (< x cx) (< y cy)) (average-points point [width height])
          (< x cx) (average-points point [width 0])
          (< y cy) (average-points point [0 height])
          :else (average-points point [0 0]))))

(defn skeleton-to-annotated-tree [skeleton index from-point from-pin]
  (let [{:keys [boxes pins]} skeleton
        pinpos (pin-positions pins)]
    ((fn f [index from-point from-pin]
       (let [box (boxes index)
             {:keys [left top pinholes width height angle]} box
             child-pinhole-indexes (filter (partial not= from-pin) (range (count pinholes)))
             child-pos (map pinholes child-pinhole-indexes)
             to-point (if (seq child-pos)
                        (apply average-points child-pos)
                        (counterpoint width height from-point))
             top-left-corner [left top]
             relative-from-angle (segment-angle [0 0] from-point)
             from-distance (distance [0 0] from-point)
             relative-to-angle (segment-angle [0 0] to-point)
             to-distance (distance [0 0] to-point)]
         {:from-point (move-point top-left-corner (+ angle relative-from-angle) from-distance)
          :to-point (move-point top-left-corner (+ angle relative-to-angle) to-distance)
          :top-left-corner [left top]
          :box-index index
          :children (for [idx child-pinhole-indexes]
                      (let [[child-box-index child-pinhole] (pinpos [index idx])
                            child-box (boxes child-box-index)]
                        (f child-box-index ((child-box :pinholes) child-pinhole) child-pinhole)))}))
     index
     from-point
     from-pin)))

(defn annotated-tree-to-static-tree [tree]
  (let [{:keys [from-point to-point children]} tree]
    (if (seq children)
      (concat [:branch from-point] (map annotated-tree-to-static-tree children))
      [:leaf from-point to-point])))

(defn adjust-annotated-tree [tree stree]
  (let [[type from-point-new & rest] stree
        {:keys [children]} tree]
    (case type
          :leaf (assoc tree
                  :from-point-new from-point-new
                  :to-point-new (first rest))
          :branch (assoc tree
                    :from-point-new from-point-new
                    :to-point-new (apply average-points (map second rest))
                    :children (map adjust-annotated-tree children rest)))))

(defn reposition-rectangle [& foo]
  (let [[top-left-corner angle from-point to-point from-point-new to-point-new] foo]
    (let [origin-angle (segment-angle from-point top-left-corner)
          spine-angle (segment-angle from-point to-point)
          spine-angle-new (segment-angle from-point-new to-point-new)
          angle-diff (- spine-angle-new spine-angle)
          origin-angle-new (+ origin-angle angle-diff)
          origin-distance (distance from-point top-left-corner)]
      [(move-point from-point-new origin-angle-new origin-distance) (+ angle angle-diff)])))


(defn adjust-skeleton [skeleton tree]
  (let [{:keys [boxes]} skeleton
        boxes-new ((fn f [boxes tree]
                     (let [{:keys [box-index from-point to-point from-point-new to-point-new children]} tree
                           box (boxes box-index)
                           {:keys [left top angle]} box
                           [[left-new top-new] angle-new] (reposition-rectangle [left top] angle from-point to-point from-point-new to-point-new)]
                       (reduce f (assoc boxes box-index (assoc box :left left-new :top top-new :angle angle-new)) children)))
                   boxes
                   tree)]
    (assoc skeleton :boxes boxes-new)))

(defn render-tree [kin]
  (let [[type p1 & rest] kin
        [x1 y1] p1]
    (concat 
     [[:div.node {:style {:left x1 :top y1}} "5"]]
     (case type
           :leaf (let [[[x2 y2]] rest]
                   [[:div.node.destination {:style {:left x2 :top y2}} "3"]])
           :branch (map render-tree rest)))))

(defn render-skeleton [skeleton]
  (let [{:keys [boxes pins]} skeleton]
    (concat (map-indexed (fn [n box]
                           (let [{:keys [left top width height color angle]} box]
                             [:div.box {:mouse :box-mouse
                                        :data {:index n
                                               :angle angle}
                                        :style {:left left
                                                :top top
                                                :width width
                                                :height height
                                                :background-color color
                                                :-webkit-transform (str "rotate(" (- angle) "rad)")}}]))
                         boxes)
            [] ;pin stuff here...
            )))

(defn render-all [state]
  (let [{:keys [tree]} state] 
    [:div [:button {:mouse :push} "push"] (render-tree (static-goal-tree tree))]))

(defn render-all [state]
  (let [{:keys [skeleton tree]} state]
    [:div (concat (render-skeleton skeleton)
                  #_(when tree
                      (render-tree tree)))]))

(defn correct-coordinate [[x y] angle]
  (let [sa (segment-angle [0 0] [x y])
        d (distance [0 0] [x y])
        angle-new (- sa angle)]
    (move-point [0 0] angle-new d)))

(defn pinhole-pos [box pinhole-index]
  (let [{:keys [top left angle pinholes]} box
        pos (pinholes pinhole-index)
        angle-old (segment-angle [0 0] pos)
        dist (distance [0 0] pos)
        angle-new (+ angle angle-old)]
    (move-point [left top] angle-new dist)))

(defn reconnect-pinholes [skeleton]
  (let [{:keys [boxes pins]} skeleton]
    (assoc skeleton
      :boxes
      (reduce (fn [boxes from-index]
                (let [pinpos (pin-positions pins)
                      pin (filter (fn [[[a b] [c d]]]
                                    (and (= a from-index)
                                         (< c a)))
                                  pinpos)]
                  (if (seq pin)
                    (let [[[[_ from-pinhole-index] [to-box-index to-pinhole-index]]] pin
                          from-box (boxes from-index)
                          to-box (boxes to-box-index)
                          {:keys [top left]} from-box
                          [x1 y1] (pinhole-pos from-box from-pinhole-index)
                          [x2 y2] (pinhole-pos to-box to-pinhole-index)]
                      (assoc boxes from-index
                             (assoc from-box
                               :left (- (+ left x2) x1)
                               :top (- (+ top y2) y1))))
                    boxes)))
              boxes
              (range (count boxes))))))

(add-mouse-watch [:box-mouse :incremental] [state first-element last-element points]
                 (let [{:keys [offset data]} (second first-element)
                       [ox oy] offset
                       relative-position (translate [(- ox) (- oy)] (first points))
                       {:keys [skeleton]} state
                       {:keys [index angle]} data
                       [x y] (correct-coordinate relative-position angle)
                       [p2x p2y :as ending-point] (last points)
                       tree (skeleton-to-annotated-tree skeleton index [x y] nil)
                       stree (annotated-tree-to-static-tree tree)
                       dtree (dynamic-goal-tree stree)
                       annealed (anneal dtree [p2x p2y])
                       stree-new (static-goal-tree annealed)
                       tree-new (adjust-annotated-tree tree stree-new)
                       skeleton-new (reconnect-pinholes (adjust-skeleton skeleton tree-new))]
                   {:skeleton skeleton-new
                    :tree stree-new}) )

(launch-app (atom initial-state) render-all)

