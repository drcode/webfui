(ns webfui-examples.views.scrolling
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/scrolling" []
         (common/layout "scrolling"))
