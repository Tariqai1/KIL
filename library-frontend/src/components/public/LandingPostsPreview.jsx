import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import {
    CalendarDaysIcon,
    ArrowLongRightIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";
import postService from "../../api/postService";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

import "swiper/css";

const API_BASE_URL = "http://127.0.0.1:8000";

const LandingPostsPreview = () => {
    const [selectedPost, setSelectedPost] = useState(null);

    const [posts, setPosts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const { data } = await postService.getAllPosts();
                const list = Array.isArray(data) ? data : data?.posts || [];
                setPosts(list.slice(0, 5)); // take few for slider
            } catch {
                setPosts([]);
            }
        })();
    }, []);

    const getFileUrl = (p) =>
        !p
            ? null
            : p.startsWith("http")
                ? p
                : `${API_BASE_URL}${p.startsWith("/") ? p : `/${p}`}`;

    return (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
            {/* Header */}
            <div className="">

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-extrabold text-[#002147]">
                        Latest Announcements
                    </h2>
                    <button
                        onClick={() => navigate("/posts")}
                        className="text-sm font-bold text-blue-700 flex items-center gap-2"
                    >
                        View All
                        <ArrowLongRightIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Swiper */}
                <Swiper
                    modules={[Autoplay]}
                    slidesPerView={1}
                    loop
                    autoplay={{
                        delay: 4000,
                        disableOnInteraction: false,
                    }}
                    className="rounded-2xl"
                >
                    {posts.map((post, i) => {
                        const imageUrl = getFileUrl(post?.file_url);

                        return (
                            <SwiperSlide key={post.id || i}>
                                <div
                                    onClick={() => setSelectedPost(post)}
                                    className="cursor-pointer bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
                                    {/* Image */}
                                    <div className="h-100 bg-slate-100 overflow-hidden">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={post?.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <PhotoIcon className="w-16 h-16 text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-8">
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mb-2">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {post?.created_at
                                                ? new Date(post.created_at).toLocaleDateString()
                                                : "N/A"}
                                        </div>

                                        <h3 className="text-2xl font-bold text-slate-800 mb-4">
                                            {post?.title || "Untitled Announcement"}
                                        </h3>

                                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">
                                            {post?.content || "Click to read full announcement"}
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            <AnimatePresence>
                {selectedPost && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPost(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden"
                        >
                            {/* Close */}
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>

                            {/* Image */}
                            <div className="bg-slate-100 h-[70vh] overflow-hidden">
                                {getFileUrl(selectedPost?.file_url) ? (
                                    <img
                                        src={getFileUrl(selectedPost.file_url)}
                                        alt={selectedPost.title}
                                        className="w-auto h-full object-contain mx-auto"
                                    />
                                ) : (
                                    <div className="h-64 flex items-center justify-center">
                                        <PhotoIcon className="w-16 h-16 text-slate-300" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-8">
                                <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    {selectedPost?.created_at
                                        ? new Date(selectedPost.created_at).toLocaleDateString()
                                        : "N/A"}
                                </div>

                                <h2 className="text-2xl font-extrabold text-[#002147] mb-4">
                                    {selectedPost?.title}
                                </h2>

                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {selectedPost?.content}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default LandingPostsPreview;
