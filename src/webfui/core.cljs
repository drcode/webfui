(ns webfui.core
  (:use [webfui.html :only [html parse-html parsed-html render-attribute-value html-delta]]
        [webfui.plugin.core :only [active-plugins Plugin declare-events fix-dom]]
        [cljs.reader :only [read-string]]))

;; This file contains the core engine for webfui. You usually don't want to load this file directly, instead load webfui.dom or webfui.framework.

(defn body []
  (.-body js/document))

(defn select-path-dom [node path]
  (if-let [[cur & more] (seq path)]
    (recur (.item (.-childNodes node) cur) more)
    node))

(defn dom-ready? []
  (= (.-readyState js/document) "complete"))

(defn dom-ready [fun]
  (set! (.-onload js/window) fun))

(defn parsed-html-watcher [key a old new]
  (let [delta  (html-delta (.-children old) (.-children new) [])]
    (doseq [[typ path a b] delta]
      (let [node (select-path-dom (body) path)]
        (case typ
              :att (if (= a :value)
                     (set! (.-value node) (str b))
                     (.setAttribute node (name a) (render-attribute-value a b)))
              :rem-att (.removeAttribute node (name a))
              :html (set! (.-innerHTML node) (apply str (map html a))))))
    (doseq [plugin @active-plugins]
      (fix-dom plugin))))

(def parsed-html-atom (atom (parsed-html. :body {} nil)))

(defn update-parsed-html-atom [new old]
  (parsed-html. :body
                {}
                (if (or (seq? new) (list? new))
                  (parse-html new)
                  (parse-html (list new)))))

(defn html-watcher [key a old new]
  (swap! parsed-html-atom (partial update-parsed-html-atom new)))

(def dom-watchers (atom {}))

(defn core-add-dom-watch [id fun]
  (swap! dom-watchers assoc id fun))

(defn init-dom [html]
  (let [b (body)]
    (doseq [plugin @active-plugins]
      (declare-events plugin (body) dom-watchers parsed-html-atom))
    (add-watch html :dom-watcher html-watcher)
    (add-watch parsed-html-atom :parsed-html-watcher parsed-html-watcher)
    (swap! html identity)))

(defn core-defdom [clj-dom]
  (if (dom-ready?)
    (init-dom clj-dom)
    (dom-ready (partial init-dom clj-dom))))
