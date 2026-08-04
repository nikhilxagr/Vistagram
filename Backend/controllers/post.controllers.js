import uploadOnCloudinary from "../config/cloudinary";
import Post from "../models/post.model";

export const uploadPost = async (req, res)=>{
try {
    const {caption, mediaType}=req.body
    let media;
    if(req.file) {
        media = await uploadOnCloudinary (req.file.path)
    }else{
        return res.status(400).json({message: "media is required"})
    }
    const post = await Post.create({
        caption,
        media: media.secure_url,
        mediaType,
        author: req.user._id
    })
    const user = await User.findById(req.user._id)
    user.posts.push(post._id)
    await user.save()


    const populatedPost = await Post.findById(post._id).populate("author", "name username profileImage");
    return res.status(201).json(populatedPost)

} catch (error) {
    return res.status(500).json({message: "Error uploading post", error})
}
}

export const getAllPosts = async (req, res)=>{
    try {
        const posts = await Post.find({author:req.userId}).populate("author", "name username profileImage").sort({createdAt: -1})
        return res.status(200).json(posts)
    } catch (error) {
        return res.status(500).json({message: "Error fetching all posts", error})
    }
}

export const like = async (req, res)=>{
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({message: "Post not found"})
        }
        
        const alreadyLiked = post.likes.some(id => id.toString() === req.user._id.toString());
        if (alreadyLiked) {
            post.likes= post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }
        await post.save();
        return res.status(200).json({message: "Post liked/unliked successfully", likesCount: post.likes.length})
    } catch (error) {
        return res.status(500).json({message: "Error liking post", error})
    }
}

export const comments = async (req, res)=>{
    try {
        const { message } = req.body;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({message: "Post not found"})
        }
        post.comments.push({
            author: req.user._id, message
        });
        await post.save();
        post.populate("comments.author", "name username profileImage");
        post.populate("author", "name username profileImage");

        return res.status(200).json({message: "Comment added successfully", commentsCount: post.comments.length})
    } catch (error) {
        return res.status(500).json({message: "Error adding comment", error})
    }
}

export const saved= async (req, res)=>{
    try {
        const postId = req.params.postId;
        const user = await User.findById(req.user._id);

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({message: "Post not found"})
        }
        
        const alreadySaved = post.saved.some(id => id.toString() === req.postId.toString());

        if (alreadySaved) {
            post.saved= post.saved.filter(id => id.toString() !== req.postId.toString());
        } else {
            post.saved.push(req.postId);
        }

        await post.save();
        await user.populate("saved", "caption media mediaType author");
        return res.status(200).json({message: "Post saved/unsaved successfully", savedCount: post.saved.length})
    } catch (error) {
        return res.status(500).json({message: "Error saving post", error})
    }
}