(ns webfui-examples.scrolling.core
  (:use [webfui.framework :only [launch-app]]
        [webfui.plugin.core :only [register-plugin]]
        [webfui.plugin.scrolling :only [scrolling]]
        [webfui.utilities :only [get-attribute]])
  (:use-macros [webfui.framework.macros :only [add-dom-watch]]))

(register-plugin (scrolling.))

(defn render-all [state]
  (let [{:keys [position]} state]
    [:center [:div {:style {:width 200 
                            :height 200
                            :overflow :auto}
                    :scroll-top position
                    :watch :container}
              [:div {:style {:height 400
                             :background-color :cyan}}]]
     [:p [:input {:watch :text-field :value position}]]]))

(defn try-parse [s]
  (let [n (js/parseInt s)]
    (if (js/isNaN n)
      0
      n))) 

(add-dom-watch :container [state new-element]
               {:position (get-attribute new-element :scroll-top)})

(add-dom-watch :text-field [state new-element]
               {:position (try-parse (get-attribute new-element :value))})

(launch-app (atom {:position 40}) render-all)