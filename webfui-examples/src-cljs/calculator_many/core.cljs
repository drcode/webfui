(ns webfui-examples.calculator-many.core
  (:use [webfui.framework :only [launch-app]]
        [webfui.utilities :only [get-attribute clicked]])
  (:use-macros [webfui.framework.macros :only [add-mouse-watch]]))

(def calc-rows 4)
(def calc-columns 10)
(def calc-num (* calc-rows calc-columns))

(def initial-state (vec (repeat calc-num
                                {:amount nil
                                 :amount-decimal nil
                                 :accumulator 0
                                 :operation nil
                                 :memory 0})))

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
  [:table.grid [:tbody (for [row (range calc-rows)]
                         [:tr (for [column (range calc-columns)]
                                (let [calc-cur (+ (* row calc-columns) column)]
                                  [:td [:table.calc [:tbody [:tr [:td {:colspan 4}
                                                                  [:div#display
                                                                   (render-display (state calc-cur))]]]
                                                     (for [row calculator-keys]
                                                       [:tr (for [[sym label mouse] row]
                                                              [:td {:colspan ({:eq 2} sym 1)}
                                                               [:div {:id sym
                                                                      :data calc-cur
                                                                      :mouse mouse}
                                                                label]])])]]]))])]])

(add-mouse-watch :num [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [index (get-attribute first-element :data)
                         {:keys [amount amount-decimal]} (state index)
                         digit (js/parseInt (name (get-attribute first-element :id)))]
                     {index (if amount-decimal
                              {:amount (+ amount (/ digit 10 (apply * (repeat amount-decimal 10))))
                               :amount-decimal (inc amount-decimal)}
                              {:amount (+ (* amount 10) digit)})})))

(add-mouse-watch :op [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [index (get-attribute first-element :data)
                         {:keys [amount operation accumulator]} (state index)]
                     {index {:amount nil
                             :amount-decimal nil
                             :accumulator (if (and amount operation)
                                            ((operations operation) accumulator amount)
                                            (or amount accumulator))
                             :operation (get-attribute first-element :id)}})))

(add-mouse-watch :period [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [index (get-attribute first-element :data)]
                     {index (when-not (:amount-decimal state)
                              {:amount-decimal 0})})))

(add-mouse-watch :ac [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [index (get-attribute first-element :data)]
                     {index (assoc (initial-state index) :memory (:memory (state index)))})))

(add-mouse-watch :ms [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [index (get-attribute first-element :data)]
                     {index (let [{:keys [amount accumulator]} (state index)]
                              {:memory (or amount accumulator)})})))

(add-mouse-watch :mr [state first-element last-element]
                 (when (clicked first-element last-element)
                   (let [index (get-attribute first-element :data)]
                     {index (let [{:keys [memory]} (state index)]
                              {:amount memory})})))

(launch-app (atom initial-state) render-all)