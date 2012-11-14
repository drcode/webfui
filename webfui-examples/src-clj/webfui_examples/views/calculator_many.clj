(ns webfui-examples.views.calculator-many
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/calculator_many" []
         (common/layout "calculator_many"))
