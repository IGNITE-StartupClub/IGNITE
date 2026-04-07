import React from 'react'
import { motion } from 'framer-motion'
import { BlogPostCard } from './ui/card-18'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function MaterialienPreview({ materials }) {
  const featured = materials[0]
  const grid = materials.slice(1, 4)

  return (
    <div className="w-full">
      {featured && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mb-6"
        >
          <BlogPostCard
            variant="featured"
            tag={featured.tag}
            date={featured.date}
            title={featured.title}
            description={featured.description}
            imageUrl={featured.imageUrl}
            href={featured.href}
            readMoreText="Zum Artikel"
          />
        </motion.div>
      )}

      {grid.length > 0 && (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {grid.map((m) => (
            <motion.div key={m.href} variants={itemVariants} className="flex">
              <BlogPostCard
                tag={m.tag}
                date={m.date}
                title={m.title}
                description={m.description}
                href={m.href}
                className="flex-1"
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
