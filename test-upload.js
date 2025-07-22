const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream('./test-documentation.md'), {
      filename: 'test-documentation.md',
      contentType: 'text/markdown'
    });
    formData.append('name', 'Test Product Documentation');
    formData.append('description', 'Test documentation for upload functionality');

    // Test upload
    const response = await fetch('http://localhost:3000/api/product-documentation', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Upload Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Upload successful!');
      
      // Test GET endpoint
      const getResponse = await fetch('http://localhost:3000/api/product-documentation');
      const getResult = await getResponse.json();
      console.log('GET Response:', JSON.stringify(getResult, null, 2));
    } else {
      console.log('❌ Upload failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload(); 