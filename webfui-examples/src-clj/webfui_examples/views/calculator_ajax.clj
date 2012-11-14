(ns webfui-examples.views.calculator-ajax
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/calculator_ajax" []
         (common/layout "calculator_ajax"))
