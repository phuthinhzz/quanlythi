// authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Tách hàm generate token ra
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      admin: user.admin,
      role: user.admin ? "admin" : "student",
    },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: "1d" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      admin: user.admin,
    },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: "7d" }
  );
};

// Login controller
exports.loginUser = async (req, res) => {
  try {
    console.log("Login attempt with:", req.body); // Debug log

    const user = await User.findOne({ mssv: req.body.mssv });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Wrong MSSV",
      });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Wrong Password",
      });
    }

    // Tạo token bằng function đã tách
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Lưu refresh token
    await User.findByIdAndUpdate(user._id, {
      refreshToken: refreshToken,
    });

    // Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password before sending response
    const { password, ...userInfo } = user._doc;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        ...userInfo,
        accessToken,
        role: user.admin ? "admin" : "student",
      },
    });

    // Log successful login
    console.log(
      `User ${user.mssv} logged in successfully at ${new Date().toISOString()}`
    );
  } catch (err) {
    console.error("Login error:", err); // Debug log
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Export các function generate token
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;

// Refresh Token
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json("You're not authenticated");
  }

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json("Refresh token is not valid");
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json("Refresh token is not valid");
      }

      // Tạo token mới
      const newAccessToken = authController.generateAccessToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      // Cập nhật refresh token trong database
      User.findByIdAndUpdate(user._id, {
        refreshToken: newRefreshToken,
      });

      // Set cookie mới
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Logout
exports.logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      // Xóa refresh token trong database
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }

    res.clearCookie("refreshToken");
    res.status(200).json("Logged out successfully");
  } catch (err) {
    res.status(500).json(err);
  }
};
exports.registerUser = async (req, res) => {
  try {
    const { mssv, email, name, password } = req.body;

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({
      $or: [{ mssv }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "MSSV or email already exists",
      });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = await User.create({
      mssv,
      email,
      name,
      password: hashedPassword,
      admin: false,
    });

    // Loại bỏ password trước khi gửi response
    const { password: _, ...userInfo } = newUser._doc;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userInfo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
// Generate tokens
exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      admin: user.admin,
      role: user.admin ? "admin" : "student",
    },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: "1d" }
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      admin: user.admin,
    },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: "7d" }
  );
};
exports.requestRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json("You're not authenticated");
    }

    // Verify refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json("Invalid refresh token");
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_KEY,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json("Token is not valid");
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Update refresh token in database
        await User.findByIdAndUpdate(user._id, {
          refreshToken: newRefreshToken,
        });

        // Set new refresh token cookie
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
    res.status(500).json(err);
  }
};
// Logout
exports.userLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // Kiểm tra nếu có refreshToken trong cookie
    if (refreshToken) {
      // Xóa refresh token trong database (nếu có)
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }

    // Xoá refresh token trong cookie của client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // bảo mật với https khi ở môi trường production
      sameSite: "strict",
      maxAge: 0, // Đặt maxAge là 0 để xoá cookie
    });

    // Trả về thông báo logout thành công
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error(err); // Log lỗi nếu có
    res.status(500).json({
      success: false,
      message: "An error occurred while logging out",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
