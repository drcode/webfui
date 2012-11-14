(ns webfui-examples.views.calculator
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/calculator" []
         (common/layout "calculator"))
