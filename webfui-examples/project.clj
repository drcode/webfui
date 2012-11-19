(defproject webfui-examples "0.2"
  :description "Examples for Webfui"
  :source-path "src-clj"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [webfui "0.2.1"]
                 [noir "1.3.0-beta10"]
                 [hiccup "1.0.1"]]
  :min-lein-version "2.0.0"
  :main webfui-examples.server
  :plugins [[lein-cljsbuild "0.2.7"]]
  :source-paths ["src-clj"]
  :cljsbuild {:builds {:add_two_numbers {:source-path "src-cljs/add_two_numbers"
                                         :compiler {:output-to "resources/public/js/add_two_numbers.js"
                                                    :optimizations :whitespace
                                                    :pretty-print true}}
                       :add_two_numbers_low_level {:source-path "src-cljs/add_two_numbers_low_level"
                                                   :compiler {:output-to "resources/public/js/add_two_numbers_low_level.js"
                                                              :optimizations :whitespace
                                                              :pretty-print true}}
                       :calculator {:source-path "src-cljs/calculator"
                                    :compiler {:output-to "resources/public/js/calculator.js"
                                               :optimizations :whitespace
                                               :pretty-print true}}
                       :calculator_many {:source-path "src-cljs/calculator_many"
                                         :compiler {:output-to "resources/public/js/calculator_many.js"
                                                    :optimizations :advanced
                                                    :pretty-print false}}
                       :calculator_ajax {:source-path "src-cljs/calculator_ajax"
                                         :compiler {:output-to "resources/public/js/calculator_ajax.js"
                                                    :optimizations :whitespace
                                                    :pretty-print true}}
                       :scrolling {:source-path "src-cljs/scrolling"
                                   :compiler {:output-to "resources/public/js/scrolling.js"
                                              :optimizations :whitespace
                                              :pretty-print true}}
                       :mouse_tracking {:source-path "src-cljs/mouse_tracking"
                                        :compiler {:output-to "resources/public/js/mouse_tracking.js"
                                                   :optimizations :whitespace
                                                   :pretty-print true}}
                       :inverse_kinematics {:source-path "src-cljs/inverse_kinematics"
                                            :compiler {:output-to "resources/public/js/inverse_kinematics.js"
                                                       :optimizations :advanced
                                                       :pretty-print false}}}})

