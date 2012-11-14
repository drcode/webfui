(ns webfui.dom-manipulation
  (:use [webfui.html :only [unparse-html]]))

;; This file is for DOM manipulation functions used by both the core of webfui as well as plugins.

(defn path-dom [node]
  (drop 3
        (reverse ((fn f [node]
                    (lazy-seq (when node
                                (cons (dec (count (take-while identity (iterate #(.-previousSibling %) node)))) (f (.-parentNode node))))))
                  node))))

(defn select-path-html [html path]
  (if-let [[cur & more] (seq path)] 
    (recur (nth (.-children html) cur) more)
    html))

(defn resolve-target [parsed-html target]
  (let [path (path-dom target)
        parsed-element (select-path-html parsed-html path)]
    (unparse-html parsed-element)))


