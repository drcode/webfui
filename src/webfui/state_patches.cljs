(ns webfui.state-patches
  (:use [clojure.set :only [union]]))

(defn patch [state diff]
  (if diff
    (cond (map? state) (into {}
                             (for [key (union (set (keys state)) (set (keys diff)))]
                               [key (let [val1 (state key)
                                          val2 (diff key)]
                                      (cond (and val1 val2) (patch val1 val2)
                                            (contains? diff key) val2
                                            :else val1))]))
          (vector? state) (if (map? diff)
                            (vec (map-indexed (fn [index item]
                                                (if-let [d (diff index)]
                                                  (patch item d)
                                                  item))
                                              state))
                            diff)
          :else diff)
    state))

