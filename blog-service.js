const fs = require("fs");
const path = require("path");

// const data_folder = "./data/";

// Define global arrays to hold data
let posts = [];
let categories = [];

let postIdCounter = 30; // Initialize with the appropriate starting ID

// Function to initialize data by reading JSON files
function initialize() {
  return new Promise((resolve, reject) => {
    // Read posts.json file
    fs.readFile(
      path.join(__dirname, "data", "posts.json"),
      "utf8",
      (err, postData) => {
        if (err) {
          reject("Unable to read posts file");
        } else {
          try {
            posts = JSON.parse(postData);

            // Read categories.json file after successfully reading posts.json
            fs.readFile(
              path.join(__dirname, "data", "categories.json"),
              "utf8",
              (err, categoryData) => {
                if (err) {
                  reject("Unable to read categories file");
                } else {
                  try {
                    categories = JSON.parse(categoryData);
                    resolve("Data initialization successful");
                  } catch (categoryError) {
                    reject("Error parsing categories JSON");
                  }
                }
              }
            );
          } catch (postError) {
            reject("Error parsing posts JSON");
          }
        }
      }
    );
  });
}

// Function to get all posts
function getAllPosts() {
  return new Promise((resolve, reject) => {
    if (posts.length === 0) {
      reject("No results returned");
    } else {
      resolve(posts);
    }
  });
}

// Function to get published posts
function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    const publishedPosts = posts.filter((post) => post.published === true);
    if (publishedPosts.length === 0) {
      reject("No published posts found");
    } else {
      resolve(publishedPosts);
    }
  });
}

function getPostsByCategory(category) {
  // Retrieve posts by a specific category
  const postsByCategory = posts.filter((post) => post.category === category);
  if (postsByCategory.length === 0) {
    return Promise.reject("No results returned.");
  }
  return Promise.resolve(postsByCategory);
}

function getPostsByMinDate(minDateStr) {
  // Retrieve posts by a minimum date
  const postsByMinDate = posts.filter(
    (post) => new Date(post.postDate) >= new Date(minDateStr)
  );
  if (postsByMinDate.length === 0) {
    return Promise.reject("No results returned.");
  }
  return Promise.resolve(postsByMinDate);
}

function getPostById(id) {
  // Retrieve a post by its ID
  const post = posts.find((post) => post.id === id);
  if (!post) {
    return Promise.reject("No result returned.");
  }
  return Promise.resolve(post);
}

// Function to get all categories
function getAllCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("No categories found");
    } else {
      resolve(categories);
    }
  });
}

const addPost = (postData) => {
  const post = {
    ...postData,
    postDate: new Date().toISOString().split("T")[0],
  };
  posts.push(post);
  return post;
};

async function getPublishedPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM posts WHERE published = 1 AND category = ?",
      [category],
      (err, results) => {
        if (err) {
          reject(err); // Reject the promise on error
        } else {
          resolve(results); // Resolve the promise with the results
        }
      }
    );
  });
}

// Export the functions
module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  getAllCategories,
  addPost,
  getPublishedPostsByCategory,
};
