(ns webfui-examples.views.add-two-numbers-low-level
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/add_two_numbers_low_level" []
         (common/layout "add_two_numbers_low_level"))
