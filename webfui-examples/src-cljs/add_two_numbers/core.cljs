(ns webfui-examples.add-two-numbers.core
  (:use [webfui.framework :only [launch-app]])
  (:use-macros [webfui.framework.macros :only [add-dom-watch]]))

(defn render-all [state]
  (let [{:keys [a b]} state]
    [:div [:input#a {:watch :watch :value a}]
     " plus "
     [:input#b {:watch :watch :value b}] 
     [:p " equals "]
     [:span (+ a b)]]))

(defn valid-integer [s] 
  (and (< (count s) 15) (re-matches #"^[0-9]+$" s)))

(add-dom-watch :watch [state new-element]
               (let [{:keys [value id]} (second new-element)]
                 (when (valid-integer value)
                   {id (js/parseInt value)})))

(launch-app (atom {:a 0 :b 0}) render-all)


