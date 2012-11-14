(ns webfui-examples.mouse-tracking.core
  (:use [webfui.framework :only [launch-app]]
        [webfui.utilities :only [get-attribute]])
  (:use-macros [webfui.framework.macros :only [add-mouse-watch]]))

(defn render-bubble [point size attributes]
  (let [[x y] point
        wid (* 50 (js/Math.sqrt size))]
    [:div (merge attributes
                 {:style (merge {:left (- x (/ wid 2))
                                 :top (- y (/ wid 2))
                                 :width wid
                                 :height wid
                                 :line-height wid 
                                 :background-color (str "rgb(" (* 4 size size) ",0," (- 260 (* 4 size size)) ")")}
                                (:style attributes))})
     size]))

(defn render-all [state]
  (let [{:keys [dragged-item sizes]} state
        {:keys [point to from]} dragged-item]
    (list [:div.layer (for [index (range 13)]
                        (render-bubble (map (fn [fun]
                                              (+ 450 (* 400 (fun (* index 0.4833)))))
                                            [js/Math.cos js/Math.sin])
                                       (sizes index)
                                       {:style {:opacity (if dragged-item
                                                           ({to 1 from 1} index 0.4)
                                                           1)}
                                        :data index
                                        :mouse :mouse}))]
          (if dragged-item ;this is a bit ugly because of a couple of webfui bug fixes that are pending
            [:div.layer (render-bubble point
                                       (sizes from)
                                       {:class :dragged
                                        :style {:background-color :black}})]
            [:div.layer]))))

(add-mouse-watch :mouse [state first-element last-element points]
                 (let [sizes (state :sizes)
                       [from-index to-index] (map (comp :data second) [first-element last-element])
                       to-index (and (not= from-index to-index) to-index)]
                   {:dragged-item (when (get-attribute first-element :active)
                                    {:point (last points)
                                     :from from-index  
                                     :to to-index})
                    :sizes (if to-index
                             (update-in sizes [to-index] + (sizes from-index))
                             sizes)}))

(launch-app (atom {:sizes (vec (repeat 13 1))}) render-all)
