(ns webfui-examples.add-two-numbers-low-level.core
  (:use [webfui.dom :only [defdom add-dom-watch]]
        [webfui.state-patches :only [patch]]))

(def my-dom (atom nil))

(defdom my-dom)

(def a 0)
(def b 0)

(defn render-all [old-dom]        
  [:div [:input {:type :text :watch :a-watch :value a}]
   " plus "
   [:input {:type :text :watch :b-watch :value b}]
   [:p " equals "] 
   [:span (+ a b)]])

(defn update-dom []
  (swap! my-dom render-all))

(update-dom)

(defn valid-integer [s]
  (and (< (count s) 15) (re-matches #"^[0-9]+$" s)))

(add-dom-watch :a-watch
               (fn [old-element new-element]
                 (let [new-a (get-in new-element [1 :value])]
                   (when (valid-integer new-a)
                     (def a (js/parseInt new-a))))
                 (update-dom)))

(add-dom-watch :b-watch   
               (fn [old-element new-element]
                 (let [new-b (get-in new-element [1 :value])]
                   (when (valid-integer new-b)
                     (def b (js/parseInt new-b))))
                 (update-dom)))

