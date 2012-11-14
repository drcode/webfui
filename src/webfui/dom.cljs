(ns webfui.dom
  (:use [webfui.core :only [core-add-dom-watch core-defdom]]
        [webfui.plugin.core :only [register-plugin]]
        [webfui.plugin.form-values :only [form-values]]))

(def add-dom-watch core-add-dom-watch)

(def defdom core-defdom)

(register-plugin (form-values.))

