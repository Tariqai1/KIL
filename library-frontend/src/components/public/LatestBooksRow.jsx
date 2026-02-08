// src/components/public/LatestBooksRow.jsx
import React from "react";
import { motion } from "framer-motion";
import PublicBookCard from "./PublicBookCard";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15, // ek ek karke card aaye
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -60 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const LatestBooksRow = ({ books = [], onBookClick }) => {
  return (
    <div className="relative w-full overflow-hidden py-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex gap-6 px-2"
      >
        {books.map((book) => (
          <motion.div
            key={book.id}
            variants={item}
            className="min-w-[260px] max-w-[260px]"
          >
            <PublicBookCard
              book={book}
              onClick={() => onBookClick?.(book)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LatestBooksRow;
