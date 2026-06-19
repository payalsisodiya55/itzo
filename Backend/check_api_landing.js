import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/v1/food/landing/careers');
    console.log("Public jobs response:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
test();
