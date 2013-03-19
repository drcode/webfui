(ns webfui.plugin.form-values
  (:use [webfui.plugin.core :only [Plugin]]
        [webfui.dom-manipulation :only [select-path-html parsed-html unparse-html path-dom resolve-target]]))

(defn input [dom-watchers parsed-html event]
  (let [target (.-target event)
        [tagname attributes :as element] (resolve-target @parsed-html target)
        event (@dom-watchers (keyword (:watch attributes)))]
    (when (and event (contains? #{:input :textarea} tagname))
      (let [value (.-value target)
            new-element (update-in element
                                   [1 :value]
                                   (fn [old]
                                     (set! (.-value target) old)
                                     value))]
        (event element new-element)))))

(def eventListeners (atom []))

(deftype form-values []
  Plugin
  (declare-events 
   [this body dom-watchers parsed-html]
   (doseq [e @eventListeners] (.removeEventListener body "input" e false))
   (let [eventListener (partial input dom-watchers parsed-html)]
    (.addEventListener    body "input" eventListener false)
    (swap! eventListeners conj eventListener)))
  (fix-dom [this]
           nil))


