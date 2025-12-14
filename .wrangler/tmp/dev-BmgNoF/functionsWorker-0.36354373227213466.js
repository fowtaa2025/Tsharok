var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-3YeoHc/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// .wrangler/tmp/pages-wOooOe/functionsWorker-0.36354373227213466.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function stripCfConnectingIPHeader2(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
__name2(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader2.apply(null, argArray)
    ]);
  }
});
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
function jsonError(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
__name(jsonError, "jsonError");
__name2(jsonError, "jsonError");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
__name(verifyPassword, "verifyPassword");
__name2(verifyPassword, "verifyPassword");
function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
__name2(base64UrlEncode, "base64UrlEncode");
async function generateToken(user, secret) {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    userId: user.user_id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 24 * 60 * 60
    // 24 hours
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  return `${data}.${encodedSignature}`;
}
__name(generateToken, "generateToken");
__name2(generateToken, "generateToken");
async function verifyToken(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(
      atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(data)
    );
    if (!isValid)
      return null;
    const payload = JSON.parse(
      atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < now)
      return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
__name2(verifyToken, "verifyToken");
async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { email, password, action } = body;
    if (action === "register") {
      const { firstName, lastName } = body;
      if (!email || !password || !firstName || !lastName) {
        return jsonError("All fields are required", 400);
      }
      if (!email.toLowerCase().endsWith("@uqu.edu.sa")) {
        return jsonError("Only UQU students can register. Please use your @uqu.edu.sa email address.", 400);
      }
      const emailRegex = /^[a-zA-Z0-9._-]+@uqu\.edu\.sa$/;
      if (!emailRegex.test(email.toLowerCase())) {
        return jsonError("Invalid email format", 400);
      }
      const existing = await env.DB.prepare(
        "SELECT user_id FROM users WHERE email = ?"
      ).bind(email).first();
      if (existing) {
        return jsonError("Email already registered", 400);
      }
      const passwordHash = await hashPassword(password);
      const username = email.split("@")[0];
      const result = await env.DB.prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'student', 1, datetime('now'), datetime('now'))
      `).bind(username, email, passwordHash, firstName, lastName).run();
      const user2 = await env.DB.prepare(
        "SELECT user_id, username, email, first_name, last_name, role FROM users WHERE email = ?"
      ).bind(email).first();
      const token2 = await generateToken(user2, env.JWT_SECRET);
      return jsonResponse({
        success: true,
        message: "Registration successful!",
        token: token2,
        user: {
          userId: user2.user_id,
          email: user2.email,
          firstName: user2.first_name,
          lastName: user2.last_name,
          role: user2.role
        }
      });
    }
    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = 1"
    ).bind(email).first();
    if (!user) {
      return jsonError("Invalid credentials", 401);
    }
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return jsonError("Invalid credentials", 401);
    }
    await env.DB.prepare(
      "UPDATE users SET last_login = datetime('now') WHERE user_id = ?"
    ).bind(user.user_id).run();
    const token = await generateToken(user, env.JWT_SECRET);
    return jsonResponse({
      success: true,
      message: "Login successful!",
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profileImage: user.profile_image
      }
    });
  } catch (error) {
    console.error("Auth error:", error);
    return jsonError(error.message || "Authentication failed", 500);
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonError("No token provided", 401);
    }
    const payload = await verifyToken(token, env.JWT_SECRET);
    if (!payload) {
      return jsonError("Invalid token", 401);
    }
    const user = await env.DB.prepare(
      "SELECT user_id, username, email, first_name, last_name, role, profile_image FROM users WHERE user_id = ? AND is_active = 1"
    ).bind(payload.userId).first();
    if (!user) {
      return jsonError("User not found", 404);
    }
    return jsonResponse({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profileImage: user.profile_image
      }
    });
  } catch (error) {
    return jsonError("Token verification failed", 401);
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
function jsonResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse2, "jsonResponse2");
__name2(jsonResponse2, "jsonResponse");
function jsonError2(message, status = 400) {
  return jsonResponse2({ success: false, error: message }, status);
}
__name(jsonError2, "jsonError2");
__name2(jsonError2, "jsonError");
async function onRequestPost2(context) {
  const { request, env } = context;
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonError2("Unauthorized - No token provided", 401);
    }
    const user = await verifyToken(token, env.JWT_SECRET);
    if (!user) {
      return jsonError2("Unauthorized - Invalid token", 401);
    }
    const body = await request.json();
    const { commentId } = body;
    if (!commentId) {
      return jsonError2("commentId is required", 400);
    }
    const existing = await env.DB.prepare(`
            SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?
        `).bind(commentId, user.userId).first();
    if (existing) {
      await env.DB.prepare(`
                DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?
            `).bind(commentId, user.userId).run();
      const countResult = await env.DB.prepare(`
                SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
            `).bind(commentId).first();
      return jsonResponse2({
        success: true,
        liked: false,
        likes: countResult?.count || 0
      });
    } else {
      await env.DB.prepare(`
                INSERT INTO comment_likes (comment_id, user_id, created_at)
                VALUES (?, ?, datetime('now'))
            `).bind(commentId, user.userId).run();
      const countResult = await env.DB.prepare(`
                SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
            `).bind(commentId).first();
      return jsonResponse2({
        success: true,
        liked: true,
        likes: countResult?.count || 0
      });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return jsonError2(error.message || "Failed to toggle like", 500);
  }
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
function jsonResponse3(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse3, "jsonResponse3");
__name2(jsonResponse3, "jsonResponse");
function jsonError3(message, status = 400) {
  return jsonResponse3({ success: false, error: message }, status);
}
__name(jsonError3, "jsonError3");
__name2(jsonError3, "jsonError");
async function onRequestPost3(context) {
  const { request, env } = context;
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonError3("Unauthorized - No token provided", 401);
    }
    const user = await verifyToken(token, env.JWT_SECRET);
    if (!user) {
      return jsonError3("Unauthorized - Invalid token", 401);
    }
    const body = await request.json();
    const { commentId, text } = body;
    if (!commentId || !text) {
      return jsonError3("commentId and text are required", 400);
    }
    if (!text.trim()) {
      return jsonError3("Reply text cannot be empty", 400);
    }
    const result = await env.DB.prepare(`
            INSERT INTO comment_replies (comment_id, user_id, content, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).bind(commentId, user.userId, text.trim()).run();
    const newReply = await env.DB.prepare(`
            SELECT 
                r.id,
                r.content as text,
                r.created_at,
                u.first_name || ' ' || u.last_name as author,
                u.user_id
            FROM comment_replies r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.id = ?
        `).bind(result.meta.last_row_id).first();
    return jsonResponse3({
      success: true,
      message: "Reply added successfully",
      reply: newReply
    });
  } catch (error) {
    console.error("Post reply error:", error);
    return jsonError3(error.message || "Failed to add reply", 500);
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
function jsonResponse4(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse4, "jsonResponse4");
__name2(jsonResponse4, "jsonResponse");
function jsonError4(message, status = 400) {
  return jsonResponse4({ success: false, error: message }, status);
}
__name(jsonError4, "jsonError4");
__name2(jsonError4, "jsonError");
async function onRequestGet2(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const contentId = url.searchParams.get("contentId");
    if (!contentId) {
      return jsonError4("contentId is required", 400);
    }
    const comments = await env.DB.prepare(`
            SELECT 
                c.id,
                c.content as text,
                c.created_at,
                c.updated_at,
                u.first_name || ' ' || u.last_name as user_name,
                u.user_id
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            WHERE c.content_id = ?
            ORDER BY c.created_at DESC
        `).bind(contentId).all();
    const commentsWithDetails = await Promise.all(
      (comments.results || []).map(async (comment) => {
        const likesResult = await env.DB.prepare(`
                    SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?
                `).bind(comment.id).first();
        const repliesResult = await env.DB.prepare(`
                    SELECT 
                        r.id,
                        r.content as text,
                        r.created_at,
                        u.first_name || ' ' || u.last_name as author
                    FROM comment_replies r
                    LEFT JOIN users u ON r.user_id = u.user_id
                    WHERE r.comment_id = ?
                    ORDER BY r.created_at ASC
                `).bind(comment.id).all();
        return {
          ...comment,
          likes: likesResult?.count || 0,
          replies: repliesResult.results || []
        };
      })
    );
    return jsonResponse4({
      success: true,
      comments: commentsWithDetails,
      count: commentsWithDetails.length
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return jsonError4(error.message || "Failed to fetch comments", 500);
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestPost4(context) {
  const { request, env } = context;
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonError4("Unauthorized - No token provided", 401);
    }
    const user = await verifyToken(token, env.JWT_SECRET);
    if (!user) {
      return jsonError4("Unauthorized - Invalid token", 401);
    }
    const body = await request.json();
    const { contentId, text } = body;
    if (!contentId || !text) {
      return jsonError4("contentId and text are required", 400);
    }
    if (!text.trim()) {
      return jsonError4("Comment text cannot be empty", 400);
    }
    const result = await env.DB.prepare(`
            INSERT INTO comments (content_id, user_id, content, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
        `).bind(contentId, user.userId, text.trim()).run();
    const newComment = await env.DB.prepare(`
            SELECT 
                c.id,
                c.content as text,
                c.created_at,
                c.updated_at,
                u.first_name || ' ' || u.last_name as user_name,
                u.user_id
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.user_id
            WHERE c.id = ?
        `).bind(result.meta.last_row_id).first();
    return jsonResponse4({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    });
  } catch (error) {
    console.error("Post comment error:", error);
    return jsonError4(error.message || "Failed to add comment", 500);
  }
}
__name(onRequestPost4, "onRequestPost4");
__name2(onRequestPost4, "onRequestPost");
function jsonResponse5(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse5, "jsonResponse5");
__name2(jsonResponse5, "jsonResponse");
function jsonError5(message, status = 400) {
  return jsonResponse5({ success: false, error: message }, status);
}
__name(jsonError5, "jsonError5");
__name2(jsonError5, "jsonError");
async function onRequestGet3(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");
    if (id) {
      const file = await env.DB.prepare(`
                SELECT 
                    c.id,
                    c.title,
                    c.type,
                    c.file_url,
                    c.file_key,
                    c.description,
                    c.file_size,
                    c.mime_type,
                    c.upload_date,
                    c.is_approved,
                    u.first_name || ' ' || u.last_name as uploader_name,
                    u.user_id as uploader_id
                FROM content c
                LEFT JOIN users u ON c.uploader_id = u.user_id
                WHERE c.id = ?
            `).bind(id).first();
      if (!file) {
        return jsonError5("File not found", 404);
      }
      return jsonResponse5({
        success: true,
        file
      });
    }
    let query = `
            SELECT 
                c.id,
                c.title,
                c.type,
                c.file_url,
                c.file_key,
                c.description,
                c.file_size,
                c.mime_type,
                c.upload_date,
                c.is_approved,
                u.first_name || ' ' || u.last_name as uploader_name,
                u.user_id as uploader_id
            FROM content c
            LEFT JOIN users u ON c.uploader_id = u.user_id
            WHERE 1=1
        `;
    const params = [];
    if (courseId) {
      query += ` AND (c.course_id = ? OR c.course_id IS NULL)`;
      params.push(courseId);
    }
    if (type) {
      query += ` AND c.type = ?`;
      params.push(type);
    }
    query += ` ORDER BY c.upload_date DESC`;
    const result = await env.DB.prepare(query).bind(...params).all();
    return jsonResponse5({
      success: true,
      files: result.results || [],
      count: result.results?.length || 0
    });
  } catch (error) {
    console.error("Get content error:", error);
    return jsonError5(error.message || "Failed to fetch content", 500);
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
function jsonResponse6(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse6, "jsonResponse6");
__name2(jsonResponse6, "jsonResponse");
function jsonError6(message, status = 400) {
  return jsonResponse6({ success: false, error: message }, status);
}
__name(jsonError6, "jsonError6");
__name2(jsonError6, "jsonError");
async function onRequestGet4(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";
    const level = url.searchParams.get("level") || "";
    const category = url.searchParams.get("category") || "";
    let query = `
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as instructor_name,
        u.profile_image as instructor_image,
        COUNT(DISTINCT e.enrollment_id) as enrollment_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.user_id
      LEFT JOIN enrollments e ON c.course_id = e.enrollment_id
      WHERE c.is_published = 1
    `;
    const params = [];
    if (search) {
      query += ` AND (c.title LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    if (level) {
      query += ` AND c.level = ?`;
      params.push(level);
    }
    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }
    query += ` GROUP BY c.course_id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const { results } = await env.DB.prepare(query).bind(...params).all();
    let countQuery = `SELECT COUNT(*) as total FROM courses WHERE is_published = 1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (title LIKE ? OR course_code LIKE ? OR description LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    if (level) {
      countQuery += ` AND level = ?`;
      countParams.push(level);
    }
    if (category) {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.total || 0;
    const courses = results.map((course) => ({
      courseId: course.course_id,
      courseCode: course.course_code,
      title: course.title,
      description: course.description,
      instructorId: course.instructor_id,
      instructorName: course.instructor_name,
      instructorImage: course.instructor_image,
      category: course.category,
      level: course.level,
      thumbnail: course.thumbnail || "/assets/images/course-placeholder.jpg",
      enrollmentCount: course.enrollment_count || 0,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));
    return jsonResponse6({
      success: true,
      courses,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error("Courses error:", error);
    return jsonError6("Failed to fetch courses", 500);
  }
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
async function onRequest(context) {
  const { request, env, params } = context;
  if (params && params.id) {
    try {
      const courseId = params.id;
      const course = await env.DB.prepare(`
        SELECT 
          c.*,
          u.first_name || ' ' || u.last_name as instructor_name,
          u.email as instructor_email,
          u.profile_image as instructor_image,
          COUNT(DISTINCT e.enrollment_id) as enrollment_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.user_id
        LEFT JOIN enrollments e ON c.course_id = e.enrollment_id
        WHERE c.course_id = ?
        GROUP BY c.course_id
      `).bind(courseId).first();
      if (!course) {
        return jsonError6("Course not found", 404);
      }
      return jsonResponse6({
        success: true,
        course: {
          courseId: course.course_id,
          courseCode: course.course_code,
          title: course.title,
          description: course.description,
          instructorId: course.instructor_id,
          instructorName: course.instructor_name,
          instructorEmail: course.instructor_email,
          instructorImage: course.instructor_image,
          category: course.category,
          level: course.level,
          thumbnail: course.thumbnail,
          syllabus: course.syllabus,
          prerequisites: course.prerequisites,
          learningOutcomes: course.learning_outcomes,
          enrollmentCount: course.enrollment_count || 0,
          createdAt: course.created_at
        }
      });
    } catch (error) {
      return jsonError6("Failed to fetch course", 500);
    }
  }
  return onRequestGet4(context);
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
function jsonResponse7(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse7, "jsonResponse7");
__name2(jsonResponse7, "jsonResponse");
function jsonError7(message, status = 400) {
  return jsonResponse7({ success: false, error: message }, status);
}
__name(jsonError7, "jsonError7");
__name2(jsonError7, "jsonError");
async function onRequestGet5(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const contentId = url.searchParams.get("contentId");
    if (!contentId) {
      return jsonError7("contentId is required", 400);
    }
    const result = await env.DB.prepare(`
            SELECT 
                r.id,
                r.score,
                r.created_at,
                r.updated_at,
                u.first_name || ' ' || u.last_name as user_name,
                u.user_id
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE r.content_id = ?
            ORDER BY r.created_at DESC
        `).bind(contentId).all();
    const ratings = result.results || [];
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0;
    return jsonResponse7({
      success: true,
      ratings,
      count: ratings.length,
      average: Number(avgRating.toFixed(1))
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    return jsonError7(error.message || "Failed to fetch ratings", 500);
  }
}
__name(onRequestGet5, "onRequestGet5");
__name2(onRequestGet5, "onRequestGet");
async function onRequestPost5(context) {
  const { request, env } = context;
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonError7("Unauthorized - No token provided", 401);
    }
    const user = await verifyToken(token, env.JWT_SECRET);
    if (!user) {
      return jsonError7("Unauthorized - Invalid token", 401);
    }
    const body = await request.json();
    const { contentId, score } = body;
    if (!contentId || score === void 0) {
      return jsonError7("contentId and score are required", 400);
    }
    if (score < 0 || score > 5) {
      return jsonError7("Score must be between 0 and 5", 400);
    }
    const existing = await env.DB.prepare(`
            SELECT id FROM ratings WHERE content_id = ? AND user_id = ?
        `).bind(contentId, user.userId).first();
    let result;
    if (existing) {
      result = await env.DB.prepare(`
                UPDATE ratings 
                SET score = ?, updated_at = datetime('now')
                WHERE content_id = ? AND user_id = ?
            `).bind(score, contentId, user.userId).run();
    } else {
      result = await env.DB.prepare(`
                INSERT INTO ratings (content_id, user_id, score, created_at, updated_at)
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
            `).bind(contentId, user.userId, score).run();
    }
    const avgResult = await env.DB.prepare(`
            SELECT AVG(score) as avg FROM ratings WHERE content_id = ?
        `).bind(contentId).first();
    return jsonResponse7({
      success: true,
      message: existing ? "Rating updated successfully" : "Rating added successfully",
      average: Number((avgResult?.avg || 0).toFixed(1))
    });
  } catch (error) {
    console.error("Post rating error:", error);
    return jsonError7(error.message || "Failed to add rating", 500);
  }
}
__name(onRequestPost5, "onRequestPost5");
__name2(onRequestPost5, "onRequestPost");
function jsonResponse8(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
__name(jsonResponse8, "jsonResponse8");
__name2(jsonResponse8, "jsonResponse");
function jsonError8(message, status = 400) {
  return jsonResponse8({ success: false, error: message }, status);
}
__name(jsonError8, "jsonError8");
__name2(jsonError8, "jsonError");
async function onRequestPost6(context) {
  const { request, env } = context;
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonError8("Unauthorized - No token provided", 401);
    }
    const user = await verifyToken(token, env.JWT_SECRET);
    if (!user) {
      return jsonError8("Unauthorized - Invalid token", 401);
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return jsonError8("No file provided", 400);
    }
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowedTypes.includes(file.type)) {
      return jsonError8(`File type not allowed: ${file.type}`, 400);
    }
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return jsonError8("File too large (max 100MB)", 400);
    }
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${user.userId}/${timestamp}-${randomId}-${sanitizedName}`;
    await env.R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type
      },
      customMetadata: {
        uploadedBy: user.userId.toString(),
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        originalName: file.name,
        fileSize: file.size.toString()
      }
    });
    const courseId = null;
    const title = formData.get("title") || file.name;
    const description = formData.get("description") || null;
    let contentType = "other";
    if (file.type.startsWith("image/"))
      contentType = "document";
    else if (file.type.startsWith("video/"))
      contentType = "video";
    else if (file.type === "application/pdf")
      contentType = "document";
    else if (file.type.includes("presentation"))
      contentType = "lecture";
    const result = await env.DB.prepare(`
      INSERT INTO content (
        title, type, file_url, file_key, upload_date, 
        uploader_id, course_id, file_size, mime_type, 
        description, is_approved, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).bind(
      title,
      contentType,
      `${env.R2_PUBLIC_URL}/${key}`,
      key,
      user.userId,
      courseId,
      // NULL to avoid FK constraint
      file.size,
      file.type,
      description
    ).run();
    return jsonResponse8({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: result.meta.last_row_id,
        key,
        filename: file.name,
        size: file.size,
        type: file.type,
        url: `${env.R2_PUBLIC_URL}/${key}`,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return jsonError8(error.message || "Upload failed", 500);
  }
}
__name(onRequestPost6, "onRequestPost6");
__name2(onRequestPost6, "onRequestPost");
async function onRequest2(context) {
  const { request, next } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var routes = [
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/comment-likes",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/comment-replies",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/content",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/courses",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/ratings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/ratings",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/upload",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/courses",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [onRequest2],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError9 = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError9;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = /* @__PURE__ */ __name(class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
}, "__Facade_ScheduledController__");
__name2(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError10 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError10;

// .wrangler/tmp/bundle-3YeoHc/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-3YeoHc/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__2, "__Facade_ScheduledController__");
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.36354373227213466.js.map
