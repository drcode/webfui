(ns webfui.html
  (:use [clojure.set :only [union]]))

(deftype parsed-tagname [tagname id classes])
(deftype parsed-html [tagname attributes children])

(defn parse-tagname [tagname]
  (let [[_ name _ id classes] (re-matches #"^([^.^#]+)(#([^.]+))?(\..+)?" tagname)]
    (parsed-tagname. (keyword name)
                     (when id
                       (keyword id))
                     (when classes
                       (map second (re-seq #"\.([^.]+)" classes))))))

(let [cache (atom {})]
  (defn parse-tagname-memoized [tagname]
    (or (@cache tagname)
        (let [val (parse-tagname tagname)]
          (swap! cache assoc tagname val)
          val))))

(declare parse-html)

(defn parse-element [element]
  (let [[tagname & more] element
        parsed (parse-tagname-memoized tagname)
        classes (.-classes parsed)
        id (.-id parsed)
        tagname (.-tagname parsed)
        attributes {}
        attributes (if classes
                     (assoc attributes
                       :class
                       (apply str (interpose \  classes)))
                     attributes)
        attributes (if id
                     (assoc attributes :id id)
                     attributes)
        [a & b] more
        [attributes children] (if (map? a)
                                [(merge attributes a) b]
                                [attributes more])]
    (parsed-html. tagname attributes (parse-html children))))

(defn merge-strings [lst]
  (if-let [[x & more] lst]
    (if-let [[y & more] more]
      (if (and (string? x) (string? y))
        (merge-strings (cons (str x y) more))
        (cons x (merge-strings (cons y more))))
      lst)
    lst))

(defn parse-html [html]
  (mapcat (fn [x]
            (cond (vector? x) [(parse-element x)]
                  (and (coll? x) (not (string? x))) (parse-html x)
                  :else [x]))
          (merge-strings html)))

(defn tag [tagname atts s]
  (if (#{:br} tagname)
    (str "<" (name tagname) atts ">")
    (str "<" (name tagname) atts ">" (apply str s) "</" (name tagname) ">")))

(defn pixels [k]
  (str (.toFixed k 3) "px"))

(defn render-css [css]
  (apply str
         (interpose \;
                    (for [[k v] css]
                      (str (name k)
                           ":"
                           (cond (keyword? v) (name v)
                                 (and (number? v) (#{:line-height :top :bottom :left :right :width :height} k)) (pixels v)
                                 :else v))))))

(defn render-attribute-value [key value]
  (cond (keyword? value) (name value)
        (= key :data) (print-str value)
        (= key :style) (render-css value)
        :else value))

(defn render-attributes [atts]
  (apply str
         (for [[key value] atts]
           (str " "
                (name key)
                "=\""
                (render-attribute-value key value)
                \"))))

(defn html [content]
  (cond (instance? parsed-html content) (let [tagname (.-tagname content)
                                              attributes (.-attributes content)
                                              children (.-children content)]
                                          (if tagname
                                            (tag tagname (when attributes
                                                           (render-attributes attributes))
                                                 (map html children))
                                            ""))
        :else (str content)))

(defn html-delta [old-html new-html path]
  (if (= (count old-html) (count new-html))
    (let [pairs (map vector old-html new-html)
          fixable (every? (fn [[old-child new-child]]
                            (if (and (instance? parsed-html old-child) (instance? parsed-html new-child))
                              (= (.-tagname old-child) (.-tagname new-child))
                              (= old-child new-child)))
                          pairs)]
      (if fixable
        (apply concat
               (map-indexed (fn [i [old-element new-element]]
                              (when (instance? parsed-html old-element)
                                (let [old-tagname (.-tagname old-element)
                                      old-attributes (.-attributes old-element)
                                      old-children (.-children old-element)
                                      new-tagname (.-tagname new-element)
                                      new-attributes (.-attributes new-element)
                                      new-children (.-children new-element)
                                      path (conj path i)
                                      att-delta (when (not= old-attributes new-attributes)
                                                  (mapcat (fn [key]
                                                            (let [old-val (old-attributes key)
                                                                  new-val (new-attributes key)]
                                                              (cond (not new-val) [[:rem-att path key]]
                                                                    (not= old-val new-val) [[:att path key new-val]]
                                                                    :else [])))
                                                          (union (set (keys old-attributes)) (set (keys new-attributes)))))
                                      child-delta (html-delta old-children new-children path)]
                                  (concat att-delta child-delta))))
                            pairs))
        [[:html path new-html]]))
    [[:html path new-html]]))

(defn unparse-html [html]
  (if (or (string? html) (number? html))
    html
    (let [tagname (.-tagname html)
          attributes (.-attributes html)
          children (.-children html)]
      (vec (concat [tagname attributes] (map unparse-html children))))))

