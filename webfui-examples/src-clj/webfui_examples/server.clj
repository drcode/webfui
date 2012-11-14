(ns webfui-examples.server
  (:use [noir.core :only [defpage]]
        [noir.response :only [redirect]])
  (:require [noir.server :as server]))

(server/load-views "src-clj/webfui_examples/views/")

(defpage "/" []
  (redirect "/index.html"))

(def memory (atom 0))

(defpage [:get "/memory"] []
  (str @memory))

(defpage [:put "/memory/:value"] {:keys [value]}
  (reset! memory value)
  (pr-str value))

(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        port (Integer. (get (System/getenv) "PORT" "8080"))]
    (server/start port {:mode mode
                        :ns 'webfui-examples})))

