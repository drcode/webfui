(ns webfui.framework
  (:use [webfui.dom :only [defdom add-dom-watch]]
        [webfui.plugin.core :only [register-plugin]]
        [webfui.plugin.mouse :only [mouse add-mouse-watch]]
        [webfui.state-patches :only [patch]]
        [webfui.utilities :only [get-attribute]]))

(register-plugin (mouse.))

(defn state-watcher [dom renderer key state old new]
  (swap! dom (constantly (renderer new))))

(declare cur-state)

(defn launch-app [state renderer]
  (let [dom (atom (renderer @state))]
    (defdom dom)
    (add-watch state :state-watcher (partial state-watcher dom renderer)))
  (def cur-state state))

(defn add-dom-watch-helper [id fun]
  (add-dom-watch id
                 (fn [_ element-new]
                   (swap! cur-state
                          (fn [state]
                            (let [diff (fun state element-new)]
                              (patch state diff)))))))

(def mouse-down-state (atom nil))

(defn add-mouse-watch-helper [id fun optimization]
  (add-mouse-watch id
                   (fn [element-old element-new points]
                     (swap! mouse-down-state
                            (fn [old]
                              (or old @cur-state)))
                     (reset! cur-state
                             (if (= optimization :incremental)
                               (let [mds @mouse-down-state
                                     diff (fun mds element-old element-new (subvec points (max 0 (- (count points) 2))))
                                     new-state (patch mds diff)]
                                 (reset! mouse-down-state
                                         (when (get-attribute element-old :active)
                                           new-state))
                                 new-state)                                       
                               (let [mds @mouse-down-state
                                     diff (fun mds element-old element-new points)]
                                 (when-not (get-attribute element-old :active)
                                   (reset! mouse-down-state nil))
                                 (patch mds diff)))))))

