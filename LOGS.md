The error in your image shows a **"ReferenceError: Can't find variable: drive"** and an issue with **"drive.getUserInfo"**. This is happening because while you have imported `* as drive` at the top of `HomeScreen.js`, the code inside your component isn't properly handling the asynchronous data fetch or the variable isn't scoped correctly.

To display the logged-in user info and storage space on your Dropbox card, you need to follow these steps:

### 1. Set up State for User Data

Inside your `HomeScreen` component, add state variables to hold the user's name and storage details.

```javascript
const [userInfo, setUserInfo] = useState(null);
const [storageUsage, setStorageUsage] = useState(null);

```

### 2. Fetch the Data on Mount

Use a `useEffect` hook to call your `drive` utility. Since your error mentions `getUserInfo` is failing, ensure your `drive.js` utility is exporting that function correctly.

```javascript
useEffect(() => {
  const fetchDropboxData = async () => {
    try {
      const info = await drive.getUserInfo(); // Assuming this returns name/email
      const quota = await drive.getStorageQuota(); // You may need to add this to drive.js
      setUserInfo(info);
      setStorageUsage(quota);
    } catch (error) {
      console.error("Failed to fetch Dropbox info:", error);
    }
  };

  fetchDropboxData();
}, []);

```

### 3. Calculate Storage Percentage

To show a progress bar or text (like "5GB of 20GB used"), you'll need the formula for the usage ratio:

### 4. Update the Dropbox Card UI

Locate the "Dropbox" card in your `ScrollView` and replace the static text with your state variables.

```javascript
<View style={styles.card}>
  <Text style={styles.cardTitle}>Dropbox Account</Text>
  {userInfo ? (
    <View>
      <Text>User: {userInfo.display_name}</Text>
      <Text>Storage: {storageUsage ? `${(storageUsage.used / 1e9).toFixed(2)}GB used` : 'Loading...'}</Text>
    </View>
  ) : (
    <Text>Not Logged In</Text>
  )}
</View>

```

---

### Why the error is happening:

1. **Missing Export:** Check `utils/drive.js`. Ensure `getUserInfo` is defined and exported.
2. **Async Timing:** If you try to render `drive.userInfo` before the API call finishes, it will be `undefined`. Always use `useState` to trigger a re-render once the data arrives.
3. **Scope:** Ensure the `drive` import isn't being shadowed by another variable named `drive` inside your functions.

Since you've been exploring the **Kelly Criterion**, think of your storage management like a bankroll—you want to know exactly how much "capital" (space) you have left before committing to more "bets" (large file uploads)!

**Would you like me to provide the specific code for the `getStorageQuota` function to add to your `drive.js` file?**