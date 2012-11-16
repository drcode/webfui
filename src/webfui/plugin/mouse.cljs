(ns webfui.plugin.mouse
  (:use [webfui.plugin.core :only [Plugin]]
        [webfui.utilities :only [body]]
        [webfui.dom-manipulation :only [resolve-target]]
        [cljs.reader :only [read-string]]))

(def mouse-watchers (atom {}))

(declare mouse-down-element)

(defn nodelist-to-seq [nl]
  (let [result-seq (map #(.item nl %) (range (.-length nl)))]
    result-seq))

(defn offset [node]
  (let [op (.-offsetParent node)]
    (if op
      (let [[x y] (offset op)]
        [(+ x (.-offsetLeft node)) (+ y (.-offsetTop node))])
      [0 0])))

(defn all-elements-at-point [client-point]
  ((fn f [element]
     (let [[x y] client-point
           chi (mapcat f (nodelist-to-seq (.-childNodes element)))]
       (if (and (.-getBoundingClientRect element)
                (let [rect (.getBoundingClientRect element)]
                  (and (<= (.-left rect) x) (<= (.-top rect) y) (> (.-right rect) x) (> (.-bottom rect) y)))) 
         (cons element chi)
         chi)))
   (body)))

(defn merge-data [acc lst]
  (if-let [[k & more] lst]
    (cond (not k) (recur acc more)
          (not acc) (recur k more)
          (and (map? k) (map? acc)) (recur (merge acc k) more)
          :else (recur k more))
    acc))

(defn mouse-element [parsed-html ev]
  (let [target (.-target ev)
        typ (.-type ev)
        point (cond (#{"touchstart"} typ) (let [touch (.item (.-touches ev) 0)]
                                            [(.-clientX touch) (.-clientY touch)])
                    (#{"touchmove"} typ) (let [touch (.item (.-touches ev) 0)]
                                           [(.-clientX touch) (.-clientY touch)])
                    (= "touchend" typ) (let [touch (.item (.-changedTouches ev) 0)]
                                         [(.-clientX touch) (.-clientY touch)])
                    :else [(.-clientX ev) (.-clientY ev)])
        elements (all-elements-at-point point)
        data (merge-data nil
                         (for [element elements]
                           (when-let [s (.getAttribute element "data")]
                             (read-string s))))]
    [(update-in (resolve-target @parsed-html target) [1] assoc :offset (offset target) :data data) [(.-pageX ev) (.-pageY ev)]]))

(defn update-offset [element target]
  (update-in element
             [1]
             (fn [attr]
               (assoc attr :offset (offset target)
                      :data (if-let [data (.getAttribute target "data")]
                              (read-string data)
                              (:data attr))))))

(defn mouse-event [element]
  (@mouse-watchers (get-in element [1 :mouse])))

(defn add-mouse-watch [id fun]
  (swap! mouse-watchers assoc id fun))

(defn mouse-down [parsed-html ev]
  #_(.preventDefault ev)
  (let [target (.-target ev)
        [new-element point] (mouse-element parsed-html ev)
        event (mouse-event new-element)]
    (when event
      (let [new-element (assoc-in new-element [1 :active] true)]
        (def mouse-down-element new-element)
        (def mouse-down-target target)
        (def points [point])
        (event new-element new-element points)))))

(defn mouse-move [parsed-html ev]
  (.preventDefault ev)
  (when mouse-down-element
    (let [target (.-target ev)
          [new-element point] (mouse-element parsed-html ev)
          event (mouse-event mouse-down-element)]
      (def points (conj points point))
      (event (update-offset mouse-down-element mouse-down-target) new-element points))))

(defn mouse-up [parsed-html ev]
  (let [target (.-target ev)
        [new-element point] (mouse-element parsed-html ev)]
    (when mouse-down-element
      (let [event (mouse-event mouse-down-element)
            first-element (update-in mouse-down-element [1] #(dissoc % :active))]
        (event (update-offset first-element mouse-down-target) new-element points)
        (def points nil)
        (def mouse-down-element nil)
        (def mouse-down-target nil)))))

(deftype mouse []
  Plugin
  (declare-events [this body dom-watchers parsed-html]
                  (.setTimeout js/window
                               (fn []
                                 (.scrollTo js/window 0 1))
                               100)
                  (.addEventListener body "mousedown" (partial mouse-down parsed-html))
                  (.addEventListener body "mousemove" (partial mouse-move parsed-html))
                  (.addEventListener body "mouseup" (partial mouse-up parsed-html))
                  (.addEventListener js/window "touchstart" (partial mouse-down parsed-html))
                  (.addEventListener js/window "touchmove" (partial mouse-move parsed-html))
                  (.addEventListener js/window "touchend" (partial mouse-up parsed-html)))
  (fix-dom [this]
           nil))


