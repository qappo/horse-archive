window.HorseyComments = {
  async fetchComments(horseId) {
    const result = await window.HorseyApi.getComments(horseId);
    const comments = window.HorseyApi.normalizeCommentsResult(result);
    const currentUser = window.HorseyAuth?.getCurrentUser?.() || {};

    return comments.map((comment) => ({
      id: comment.id || comment.comment_id || "",
      horse_id: comment.horse_id || horseId,
      parent_comment_id: comment.parent_comment_id || null,
      user_id: comment.user_id || null,
      username: comment.username || comment.user_name || comment.author || "匿名用户",
      avatar_url: comment.avatar_url || "",
      content: comment.content || comment.text || comment.comment || "",
      like_count: Number(comment.like_count || 0),
      liked_by_me: Boolean(comment.liked_by_me),
      can_delete: Boolean(comment.can_delete) || currentUser.role === "admin",
      created_at: comment.created_at || comment.createdAt || comment.time || ""
    }));
  },

  async submitComment(horseId, content, parentCommentId = null) {
    return window.HorseyApi.createComment({
      horse_id: horseId,
      parent_comment_id: parentCommentId,
      content
    });
  },

  async deleteComment(commentId) {
    return window.HorseyApi.deleteComment(commentId);
  }
};
