/*********************************************************************************
*  BTI325 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: _Yash A. Akbari_ Student ID: _126403229_ Date: _ 09-28-2023 _
*
*  Online (Cyclic) Link: https://poised-dove-threads.cyclic.cloud/about

********************************************************************************/

const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");

const stripJs = require("strip-js");

const app = express();
const port = process.env.PORT || 8080;

// Configure "express-handlebars"
// const hbs = exphbs.create({
//   layoutsDir: `${__dirname}/views/layouts`,
//   extname: ".hbs",
// });

// configuring express-handlebars as hbs
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", "hbs");

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: "dp8pjxtwe",
  api_key: "531922566116931",
  api_secret: "lltZhDmbjUkxi28ln6YRS9oZse0",
  secure: true,
});

const upload = multer();

const blogService = require("./blog-service");

// Serve static files from the 'public' folder
app.use(express.static("public"));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Redirect the root URL to the '/about' route
app.get("/", (req, res) => {
  res.redirect("/blog");
});

// Serve the 'about.html' file for the '/about' route
app.get("/about", (req, res) => {
  res.render("about", { layout: "main" });
});

// Route to serve addPost.html
app.get("/posts/add", (req, res) => {
  res.render("addPost", { layout: "main" });
});

// Step 2: Adding the "Post" route
app.post("/posts/add", upload.single("featureImage"), async (req, res) => {
  try {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    const uploaded = await upload(req);

    req.body.featureImage = uploaded.url;

    const postData = {
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      published: req.body.published === "on",
      featureImage: uploaded.url,
    };

    const addedPost = await blogService.addPost(postData);
    console.log("Added post:", addedPost);
    res.redirect("/posts");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uploading image" });
  }
});

// Update the existing GET "/blog" route with the following code
app.get("/blog", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogService.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

// Update the "/posts" route to handle category and minDate filters
app.get("/posts", (req, res) => {
  const { category, minDate } = req.query;

  if (category) {
    // Filter by category
    blogService
      .getPostsByCategory(parseInt(category))
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else if (minDate) {
    // Filter by minDate
    blogService
      .getPostsByMinDate(minDate)
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else {
    // Return all posts without any filter
    blogService
      .getAllPosts()
      .then((data) => {
        res.render("posts", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

app.get("/blog/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blogService.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blogService.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blogService.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blogService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

// Add the "/post/value" route to get a single post by ID
app.get("/post/:id", (req, res) => {
  const postId = parseInt(req.params.id);

  blogService
    .getPostById(postId)
    .then((post) => {
      if (!post) {
        res.status(404).json({ message: "Post not found" });
      } else {
        res.json(post);
      }
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.get("/categories", (req, res) => {
  blogService
    .getCategories()
    .then((data) => {
      res.render("categories", { categories: data });
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

// Handle 404 (Not Found) errors
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// Initialize the blog-service and start the server
blogService
  .initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Express http server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
