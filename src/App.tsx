import './App.css'
import ChatBot from './components/chatbot/ChatBot'
import { motion } from 'framer-motion'

function App() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col ">
      <motion.header
        className="bg-gray-800 shadow-md p-4 border-b border-gray-700"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold text-gray-100">Your Application</h1>
      </motion.header>

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-2xl font-bold mb-4 text-gray-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Welcome to Our Service
            </motion.h2>
            <motion.p
              className="text-gray-300 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              We provide top-notch services tailored to your needs. Our expert team is always ready to assist you.
            </motion.p>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-blue-900 p-4 rounded-lg border border-blue-700 hover:shadow-lg hover:shadow-blue-900/30 transition-all"
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                <h3 className="font-bold text-lg text-blue-300 mb-2">Professional Consultation</h3>
                <p className="text-blue-200">Get expert advice from our team of professionals.</p>
              </motion.div>
              <motion.div
                className="bg-green-900 p-4 rounded-lg border border-green-700 hover:shadow-lg hover:shadow-green-900/30 transition-all"
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                <h3 className="font-bold text-lg text-green-300 mb-2">Appointment Scheduling</h3>
                <p className="text-green-200">Easily book appointments at your convenience.</p>
              </motion.div>
              <motion.div
                className="bg-purple-900 p-4 rounded-lg border border-purple-700 hover:shadow-lg hover:shadow-purple-900/30 transition-all"
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                <h3 className="font-bold text-lg text-purple-300 mb-2">Personalized Care</h3>
                <p className="text-purple-200">Receive tailored care based on your specific needs.</p>
              </motion.div>
              <motion.div
                className="bg-yellow-900 p-4 rounded-lg border border-yellow-700 hover:shadow-lg hover:shadow-yellow-900/30 transition-all"
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
              >
                <h3 className="font-bold text-lg text-yellow-300 mb-2">24/7 Support</h3>
                <p className="text-yellow-200">Our support team is always available to assist you.</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <ChatBot />
    </div>
  )
}

export default App
