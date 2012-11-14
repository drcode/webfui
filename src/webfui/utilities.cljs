(ns webfui.utilities)

(defn body []
  (.-body js/document))

(defn get-attribute [element key]
  (get-in element [1 key]))

(defn clicked [first-element last-element]
  (and (= first-element last-element) (not (get-attribute first-element :active))))

