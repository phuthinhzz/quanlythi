// userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const xlsx = require("xlsx");
const Class = require("../models/Class");
exports.getUserById = async (req, res) => {
  try {
    // Lấy id từ tham số URL
    const userId = req.params.id;

    // Tìm người dùng trong cơ sở dữ liệu
    const user = await User.findById(userId);

    // Kiểm tra nếu người dùng không tồn tại
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trả về thông tin người dùng
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Lấy danh sách user (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mssv: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Tạo user mới (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { mssv, email, name, password, admin } = req.body;

    // Kiểm tra trùng lặp
    const exists = await User.findOne({
      $or: [{ mssv }, { email }],
    });

    if (exists) {
      return res.status(400).json({
        message: "MSSV or email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = await User.create({
      mssv,
      email,
      name,
      password: hashedPassword,
      admin: admin || false,
    });

    const { password: _, ...userInfo } = newUser._doc;
    res.status(201).json(userInfo);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Import users từ file Excel
exports.importUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const userData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: [],
      errors: [],
    };

    // Hash password mặc định

    for (const user of userData) {
      try {
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash(user.password, salt);
        // Validate dữ liệu
        if (!user.mssv || !user.email || !user.name) {
          results.errors.push({
            mssv: user.mssv.trim(),
            error: "Missing required fields",
          });
          continue;
        }

        // Kiểm tra trùng lặp
        const exists = await User.findOne({
          $or: [{ mssv: user.mssv.trim() }, { email: user.email.trim() }],
        });

        if (exists) {
          results.errors.push({
            mssv: user.mssv.trim(),
            error: "MSSV or email already exists",
          });
          continue;
        }

        // Tạo user mới
        const newUser = await User.create({
          ...user,
          password: defaultPassword,
          admin: false,
        });

        results.success.push(newUser.mssv);
      } catch (error) {
        results.errors.push({
          mssv: user.mssv.trim(),
          error: error.message,
        });
      }
    }

    // Xóa file sau khi import
    require("fs").unlinkSync(req.file.path);

    res.status(200).json({
      message: userData,
      results,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Update thông tin user
exports.updateUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Nếu có cập nhật password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Chỉ admin mới có thể cập nhật trường admin
    if (!req.user.admin) {
      delete updateData.admin;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(404).json("User not found");
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};
// Xóa user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json("User not found");
    }

    // Tìm tất cả các lớp học mà user tham gia
    const enrolledClasses = await Class.find({
      students: req.params.id,
    });
    console.log("enrolledClasses", enrolledClasses);

    // Nếu user tham gia vào ít nhất một lớp học, loại bỏ user khỏi các lớp học đó
    if (enrolledClasses.length > 0) {
      const updatePromises = enrolledClasses.map(async (classData) => {
        // Loại bỏ user khỏi danh sách students của class
        classData.students = classData.students.filter(
          (studentId) => studentId.toString() !== req.params.id
        );
        // Lưu lại lớp học đã cập nhật
        await classData.save();
      });

      // Chờ tất cả các lớp học được cập nhật
      await Promise.all(updatePromises);
    }

    // Sau khi đã loại bỏ user khỏi tất cả các lớp học, xóa user khỏi database
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

// Lấy thông tin user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(404).json("User not found");
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { mssv: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// exports.deleteUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Kiểm tra xem user có đang trong lớp học nào không
//     const enrolledClass = await Class.findOne({
//       students: req.params.id,
//     });

//     if (enrolledClass) {
//       return res.status(400).json({
//         message: "Cannot delete user enrolled in classes",
//       });
//     }

//     await User.findByIdAndDelete(req.params.id);
//     res.status(200).json({ message: "User deleted successfully" });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

exports.editUser = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    // Nếu có cập nhật password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Chỉ admin mới có thể cập nhật trường admin
    if (!req.user.admin) {
      delete updateData.admin;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.getAllUserNotQuery = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ message: "Users not found" });
    }
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
}