import React from 'react'
import { motion } from 'framer-motion'
import { BlogPostCard } from './ui/card-18'

// Animation variants for the container to stagger children
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

// Animation variants for child items
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export default function NewsGrid({ posts }) {
  const featuredPost = posts[0]
  const gridPosts = posts.slice(1)

  return (
    <div className="w-full">
      {/* Featured Post */}
      {featuredPost && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mb-8 md:mb-12"
        >
          <BlogPostCard
            variant="featured"
            tag={featuredPost.tag}
            date={featuredPost.date}
            title={featuredPost.title}
            description={featuredPost.description}
            imageUrl={featuredPost.imageUrl}
            href={featuredPost.href}
          />
        </motion.div>
      )}

      {/* Grid of remaining posts */}
      {gridPosts.length > 0 && (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {gridPosts.map((post, index) => (
            <motion.div key={index} variants={itemVariants}>
              <BlogPostCard
                tag={post.tag}
                date={post.date}
                title={post.title}
                description={post.description}
                href={post.href}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
