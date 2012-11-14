(ns webfui-examples.views.mouse-tracking
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/mouse_tracking" []
         (common/layout "mouse_tracking"))
