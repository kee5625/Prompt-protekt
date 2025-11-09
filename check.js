import { Client } from "@gradio/client";
    
// 1. Connect to your Space
const client = await Client.connect("Goofybaka/pii");

// 2. Call predict with an ARRAY of inputs
const result = await client.predict("/predict", [ 
    "Hello!! MY ssn is 123-20-4329 and i work at apple.co as director"  // <-- This is the fix
]);

console.log(result.data);