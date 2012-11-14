(ns webfui-examples.views.inverse-kinematics
  (:require [webfui-examples.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core :only [defpage]]
        [hiccup.core :only [html]]))

(defpage "/inverse_kinematics" []
         (common/layout "inverse_kinematics"))
