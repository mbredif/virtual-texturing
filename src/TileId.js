//
//
//

export const TileId = {

  // <-----14 -----><- ----14-- ---><-4>
  // xxxxxxxx xxxxxxyy yyyyyyyy yyyyzzzz :  14+14+4 -> 0<=z<=14

  create : function(x, y, z) {
    return ((x & 0x2FFF) << 18) | ((y & 0x2FFF) << 4) | (z & 0xF);
  },

  getX : function(id) {
    return (id >> 18) & 0x2FFF;
  },

  getY : function(id) {
    return (id >> 4) & 0x2FFF;
  },

  getZ : function(id) {
    return id & 0xF;
  },

  isValid: function (id) {
    return id == 0xF;
  },

  createInvalid: function () {
    return 0xF;
  }
};
