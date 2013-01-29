# WebFUI - Client Side Web Development Framework For ClojureScript

![logo](http://lisperati.com/webfui/logo.png)

## Philosophy of WebFUI

The goal of WebFUI is to let you do client-side Web programming in ClojureScript without having to ever deal with the DOM. Instead, all DOM is generated in realtime from a Clojure atom that contains just "plain old data" (called [EDN](https://github.com/edn-format/edn) in Clojure.) This "DOM EDN" is also kept synchronized with a state atom that also contains EDN, where all the state for your program is kept.

You, the programmer, is only responsible for providing the functions shown in red in the picture below:

![graph](http://lisperati.com/webfui/graph.png)

These functions in red can be written 100% in the functional style, which is one of the benefits of WebFUI. The other benefit is that the data that controls the DOM is just "plain old data" that eases unit testing and debugging.

*Note: WebFUI is still an alpha project and has some limitations. Currently it only supports only Webkit based browsers (Chrome, Safari, including on Android/iOS).*

## Tech Demo Showing Off WebFUI

Here is an [inverse kinematics demo written 100% in ClojureScript](http://lisperati.com/webfui/inverse_kinematics.html)- Browse the source code in the webfui-examples directory. This example is pure HTML5, and using WebFUI means none of the application code directly manipulates the DOM. Click on the figure to drag it around the screen. 

## Installing WebFUI

WebFUI is best installed by using [leiningen](https://github.com/technomancy/leiningen). Include the following in the dependencies of your project.clj:

```clojure
:dependencies [[webfui "0.2.1"]]
```

Your application needs to be a ClojureScript application, and I recommend you use the [lein-cljsbuild plugin](https://github.com/emezeske/lein-cljsbuild) plugin for leiningen to build it.

## Compiling the Examples

In the webfui-examples directory you'll see examples of webfui in action. Just run "lein deps;lein cljsbuild once;lein run" and fire up your Safari, Chrome, or iOS browser to "localhost:8080".

A Simple WebFUI App

Here is an entire concrete example program using WebFUI. It displays two edit fields and displays the sum of the numbers entered into those fields as a result (try it [here](http://lisperati.com/webfui/add_two_numbers.html))

```clojure
(ns webfui-examples.add-two-numbers.core
  (:use [webfui.framework :only [launch-app]])
  (:use-macros [webfui.framework.macros :only [add-dom-watch]]))

(defn render-all [state]❶
  (let [{:keys [a b]} state]
    [:div [:input#a {:watch :watch :value a}]❷
          " plus "
          [:input#b {:watch :watch :value b}]❸
          [:p " equals "]
          [:span (+ a b)]]))

(defn valid-integer [s]❹
  (and (< (count s) 15) (re-matches #"^[0-9]+$" s)))

(add-dom-watch :watch [state new-element old-element]❺
               (let [{:keys [value id]} (second new-element)]
                 (when (valid-integer value)
                   {id (js/parseInt value)})))❻

(launch-app (atom {:a 0 :b 0}) render-all)❼
```

## How State Changes Make it to the DOM

We initialize a WebFUI app by calling `launch-app` ❼ and supplying a state atom and the `render-all` ❶ function. In this example, the state consists only of the values in the edit fields named `A` and `B`. As you can see, the `render-all` function just transforms the state into HTML. (using the same syntax used by [hiccup](https://github.com/weavejester/hiccup).)

## How DOM Changes Make it to the State

This happens by attaching *DOM watchers* to the DOM. You can see right here ❷ and here ❸ that there is an attribute called `watch` attached to the generated html (WebFUI html can have special attributes that goes beyond standard html.) This will link the edit controls to a DOM watcher declared here ❺. The DOM watcher is responsible for updating the state to adjust to changes in the DOM: In this case, it means to update the A and B fields in the state (which it does by looking up the ID of the text field which is the same as the key in the state ❻) if the numbers entered in by the user into the fields changes. Note that it checks whether the fields contain valid integers with this function ❹. Because of the realtime nature of WebFUI you'll see that this automagically prevents a user from entering non-numeric values into the text fields.

These DOM watchers are fundamentally different than javascript "on__" events in that they use a "Show, don't tell" design: You don't get an *event object* telling you *what* changed, but instead get to look at the before and after versions of the HTML (passed in via `new-element` and `old-element` ❺) that *shows* you what changed.

## License

Distributed under the Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php), the same as Clojure.
