import axios from 'axios';

async function test() {
  try {
    const resAdmin = await axios.get('http://localhost:5000/api/v1/food/admin/careers/jobs', {
      // no auth token here, just see if it hits a 401 instead of 404
      validateStatus: () => true
    });
    console.log("Admin jobs status:", resAdmin.status);
    
    // Also let's try other routes
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
