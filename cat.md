The fix for the vertical scrolling issue was applied to the **`contentContainer`** style within the `styles` object.

Specifically, I added **`paddingBottom: 80`** to that style.

```javascript
// Before the fix:
// contentContainer: {
//   padding: 15,
// },

// After the fix:
contentContainer: {
  padding: 15,
  paddingBottom: 80, // Added padding to ensure the submit button is fully visible
},
```

In React Native, `ScrollView`'s `contentContainerStyle` defines the style for the inner container that holds all the scrollable elements. By giving it extra bottom padding, you ensure there is enough empty space at the very end of the content to allow the last item (the Submit Button) to scroll completely up and stay visible at the top of the viewport.