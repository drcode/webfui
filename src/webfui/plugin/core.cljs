(ns webfui.plugin.core)

(def active-plugins (atom []))

(defprotocol Plugin
  (declare-events [this body dom-watchers parsed-html])
  (fix-dom [this]))

(defn register-plugin [plugin]
  (swap! active-plugins conj plugin))