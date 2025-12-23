<h1>Bridge-IT</h1>
<p><strong>Group 3 – E-Commerce Term Project</strong></p>

<p><strong>Authors:</strong><br>
Devon Blackman · Ian Brown · David Wu</p>

<p><strong>The deployed site can be accessed <a href link="https://web-term-project-group3.onrender.com/">here</a> .</strong></p>

<hr>

<h2> Project Overview</h2>

<p>
<strong>Bridge-IT</strong> is a full-stack e-commerce web application developed as a term project to demonstrate the concepts, tools, and workflows learned throughout our course.
</p>

<p>
The project simulates a modern online store, including:
</p>

<ul>
  <li>User authentication</li>
  <li>Product browsing and filtering</li>
  <li>Shopping cart functionality</li>
  <li>Profile-based user sessions</li>
  <li>A responsive UI inspired by mobile-first design principles</li>
</ul>

<p>
This repository represents both our <strong>technical implementation</strong> and our <strong>team collaboration process</strong>.
</p>

<hr>

<h2> Design & UX Intent</h2>

<p>
The design and UX decisions for Bridge-IT were guided by accessibility, clarity, and app-like interaction patterns.
</p>

<p>Key ideas from the original design document include:</p>

<ul>
  <li>A hamburger menu for secondary navigation (login/register, cart, articles, contact)</li>
  <li>A quick-access bottom bar to emulate mobile app navigation</li>
  <li>Category chips and quick filters for faster product discovery</li>
  <li>A hero section highlighting featured or latest products</li>
  <li>
    Product cards with:
    <ul>
      <li>Image previews</li>
      <li>Quick add-to-cart actions</li>
      <li>Category indicators</li>
      <li>Expandable product detail views</li>
    </ul>
  </li>
</ul>

<hr>

<h2> Tech Stack</h2>

<h3>Frontend</h3>
<ul>
  <li>HTML5 / CSS3</li>
  <li>Vanilla JavaScript</li>
  <li>Responsive, mobile-first layout</li>
</ul>

<h3>Backend</h3>
<ul>
  <li>Node.js</li>
  <li>Express.js</li>
  <li>MongoDB (Atlas for production, local Mongo for development)</li>
  <li>Mongoose ODM</li>
  <li>JWT authentication</li>
</ul>

<h3>Deployment</h3>
<ul>
  <li>Render (backend + static frontend)</li>
  <li>MongoDB Atlas (production database)</li>
</ul>

<hr>

<h2> Running the Project Locally</h2>

<h3>1️. Clone the repository</h3>
<pre><code>git clone https://github.com/&lt;your-repo&gt;/Web-Term-Project-Group3.git
cd Web-Term-Project-Group3</code></pre>

<h3>2️. Install dependencies</h3>
<pre><code>npm install</code></pre>

<h3>3️. Set up environment variables</h3>

<p>Create a <code>.env</code> file in the project root:</p>

<pre><code>MONGODB_URI=mongodb://127.0.0.1:27017/bridgeit
JWT_SECRET=your_local_secret
NODE_ENV=development
PORT=3000</code></pre>

<p>
If using MongoDB Atlas locally, replace <code>MONGODB_URI</code> with your Atlas connection string.
</p>

<hr>

<h3>4️. Seed the product database (important)</h3>

<p>
Any time you:
</p>

<ul>
  <li>Modify products</li>
  <li>Add new products</li>
  <li>Reset the database</li>
</ul>

<p>
You <strong>must</strong> run the seed script:
</p>

<pre><code>node seedProducts.js</code></pre>

<p>
This clears and repopulates the product collection with the current dataset.
</p>

<hr>

<h3>5️. Start the server</h3>

<pre><code>npm start</code></pre>

<p>Then open:</p>

<pre><code>http://localhost:3000</code></pre>

<hr>

<h2> Product Seeding Notes</h2>

<ul>
  <li><code>seedProducts.js</code> initializes product data</li>
  <li>Run it after any product schema or data changes</li>
  <li>Ensures consistent behavior across environments</li>
</ul>

<hr>

<h2> Authentication Flow</h2>

<ul>
  <li>Users register via <code>/auth/register</code></li>
  <li>Login returns a JWT stored in <code>localStorage</code></li>
  <li>Authenticated requests use:</li>
</ul>

<pre><code>Authorization: Bearer &lt;token&gt;</code></pre>

<p>
Profile and cart data are scoped to the authenticated user.
</p>

<hr>

<h2> Team Workflow & Lessons Learned</h2>

<p>
One of the most valuable lessons from this project was the importance of structured collaboration.
</p>

<h3>Key takeaways:</h3>

<ul>
  <li>All pull requests required peer review and approval</li>
  <li>This prevented broken deployments and silent frontend failures</li>
  <li>Code reviews improved consistency and code quality</li>
  <li>Small issues were caught early, saving significant debugging time</li>
  <li>Use index to establish baseline styles and function (framework) for other pages</li>
  <li>Other pages should have their own respective CSS and JS files to handle unique styles and behaviors</li>
</ul>

<p>
This workflow mirrors real-world engineering practices and was critical to the project’s success.
</p>

<hr>

<h2> Academic Context</h2>

<p>
This project was completed as part of a university course focused on:
</p>

<ul>
  <li>Full-stack web development</li>
  <li>RESTful APIs</li>
  <li>Authentication and authorization</li>
  <li>Team-based software engineering practices</li>
</ul>

<p>
It is intended for <strong>educational and demonstration purposes</strong>.
</p>

<hr>

<h2> Final Notes</h2>

<p>
Bridge-IT represents not just a working application, but a snapshot of our growth as developers — technically, collaboratively, and professionally.
</p>

<p>
Thank you for taking the time to review our work.
</p>
