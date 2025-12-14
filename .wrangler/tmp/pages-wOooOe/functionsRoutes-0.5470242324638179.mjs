import { onRequestGet as __api_auth_ts_onRequestGet } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\auth.ts"
import { onRequestPost as __api_auth_ts_onRequestPost } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\auth.ts"
import { onRequestPost as __api_comment_likes_ts_onRequestPost } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\comment-likes.ts"
import { onRequestPost as __api_comment_replies_ts_onRequestPost } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\comment-replies.ts"
import { onRequestGet as __api_comments_ts_onRequestGet } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\comments.ts"
import { onRequestPost as __api_comments_ts_onRequestPost } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\comments.ts"
import { onRequestGet as __api_content_ts_onRequestGet } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\content.ts"
import { onRequestGet as __api_courses_ts_onRequestGet } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\courses.ts"
import { onRequestGet as __api_ratings_ts_onRequestGet } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\ratings.ts"
import { onRequestPost as __api_ratings_ts_onRequestPost } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\ratings.ts"
import { onRequestPost as __api_upload_ts_onRequestPost } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\upload.ts"
import { onRequest as __api_courses_ts_onRequest } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\courses.ts"
import { onRequest as __api__middleware_ts_onRequest } from "C:\\xampp\\htdocs\\Tsharok\\functions\\api\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_ts_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_ts_onRequestPost],
    },
  {
      routePath: "/api/comment-likes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_comment_likes_ts_onRequestPost],
    },
  {
      routePath: "/api/comment-replies",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_comment_replies_ts_onRequestPost],
    },
  {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_comments_ts_onRequestGet],
    },
  {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_comments_ts_onRequestPost],
    },
  {
      routePath: "/api/content",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_content_ts_onRequestGet],
    },
  {
      routePath: "/api/courses",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_courses_ts_onRequestGet],
    },
  {
      routePath: "/api/ratings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_ratings_ts_onRequestGet],
    },
  {
      routePath: "/api/ratings",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ratings_ts_onRequestPost],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_ts_onRequestPost],
    },
  {
      routePath: "/api/courses",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_courses_ts_onRequest],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_ts_onRequest],
      modules: [],
    },
  ]