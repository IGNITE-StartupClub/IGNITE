import React from 'react'
import { motion } from 'framer-motion'
import { BlogPostCard } from './ui/card-18'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

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

export default function MaterialsGrid({ materials }) {
  const featured = materials[0]
  const rest = materials.slice(1)

  return (
    <div className="w-full">
      {featured && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 md:mb-12"
        >
          <BlogPostCard
            variant="featured"
            tag={featured.tag}
            date={featured.date}
            title={featured.title}
            description={featured.description}
            imageUrl={featured.imageUrl}
            href={featured.href}
          />
        </motion.div>
      )}

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {rest.map((material) => (
            <motion.div key={material.href} variants={itemVariants}>
              <BlogPostCard
                tag={material.tag}
                date={material.date}
                title={material.title}
                description={material.description}
                imageUrl={material.imageUrl}
                href={material.href}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
