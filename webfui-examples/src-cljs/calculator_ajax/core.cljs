(ns webfui-examples.calculator-ajax.core
  (:use [webfui.framework :only [launch-app]]
        [webfui.utilities :only [get-attribute clicked]]
        [cljs.reader :only [read-string]])
  (:use-macros [webfui.framework.macros :only [add-mouse-watch]])
  (:require [goog.net.XhrIo :as xhr]))

(def initial-state {:amount nil
                    :amount-decimal nil
                    :accumulator 0
                    :operation nil
                    :memory :unknown})

(def calculator-keys [[[:ac "AC" :ac] [:ms "MS" :ms] [:mr "MR" :mr] [:div "÷" :op]]
                      [[:7 "7" :num] [:8 "8" :num] [:9 "9" :num] [:mult "×" :op]]
                      [[:4 "4" :num] [:5 "5" :num] [:6 "6" :num] [:minus "-" :op]]
                      [[:1 "1" :num] [:2 "2" :num] [:3 "3" :num] [:plus "+" :op]]
                      [[:period "." :period] [:0 "0" :num] [:eq "=" :op]]])

(def operations {:div /
                 :mult *
                 :minus -
                 :plus +
                 :eq identity})

(defn right-shorten [s]
  (subs s 0 (dec (count s))))

(defn format-accumulator [accumulator]
  (loop [s (.toFixed accumulator 12)]
    (case (last s)
          \0 (recur (right-shorten s))
          \. (right-shorten s)
          s)))

(defn check-overflow [s]
  (cond (and (<= (count s) 12) (not= (last s) \.)) s
        (some (partial = \.) s) (recur (right-shorten s))
        :else "OVERFLOW"))

(defn render-display [{:keys [amount amount-decimal accumulator]}]
  (check-overflow (cond (not amount) (format-accumulator accumulator)
                        amount-decimal (.toFixed amount amount-decimal)
                        :else (str amount))))

(defn render-all [state]
  [:table [:tbody [:tr [:td {:colspan 4}
                        [:div#display (render-display state)]]]
           (for [row calculator-keys]
             [:tr (for [[sym label mouse] row]
                    [:td {:colspan ({:eq 2} sym 1)}
                     [:div {:id sym
                            :mouse mouse}
                      label]])])]])

(add-mouse-watch :num [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [{:keys [amount amount-decimal]} state
                         digit (js/parseInt (name (get-attribute first-element :id)))]
                     (if amount-decimal
                       {:amount (+ amount (/ digit 10 (apply * (repeat amount-decimal 10))))
                        :amount-decimal (inc amount-decimal)}
                       {:amount (+ (* amount 10) digit)}))))

(add-mouse-watch :op [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [{:keys [amount operation accumulator]} state]
                     {:amount nil
                      :amount-decimal nil
                      :accumulator (if (and amount operation)
                                     ((operations operation) accumulator amount)
                                     (or amount accumulator))
                      :operation (get-attribute first-element :id)})))

(add-mouse-watch :period [state first-element last-element]
                 (when (clicked first-element last-element)
                   (when-not (:amount-decimal state)
                     {:amount-decimal 0})))

(add-mouse-watch :ac [state first-element last-element]
                 (when (clicked first-element last-element)
                   (assoc initial-state :memory (:memory state))))

(add-mouse-watch :ms [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [{:keys [amount accumulator]} state]
                     {:memory (or amount accumulator)})))

(add-mouse-watch :mr [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [{:keys [memory]} state]
                     {:amount memory})))

(def my-state (atom initial-state))

(defn send [safe-state method uri fun]
  (xhr/send uri
            (fn [event]
              (let [response (.-target event)]
                (if (.isSuccess response)
                  (fun (.getResponseText response))
                  (reset! my-state safe-state))))
            (name method)))

(defn memory-loaded [text]
  (let [memory (read-string text)]
    (swap! my-state assoc :memory memory :amount memory)))

(defn memory-saved []
  (swap! my-state assoc :memory :unknown))

(add-watch my-state :my-watch
           (fn [_ _ old new]
             (let [{:keys [amount memory]} new]
               (when (= amount :unknown)
                 (if (= (:amount old) :unknown)
                   (reset! my-state old)
                   (send old :get "memory" memory-loaded)))
               (when (not= memory :unknown)
                 (if (not= (:memory old) :unknown)
                   (reset! my-state old)
                   (send old :put (str "memory/" memory) memory-saved))))))

(launch-app my-state render-all)