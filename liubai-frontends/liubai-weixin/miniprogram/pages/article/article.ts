

const typeToUrl = {
  "flow": "https://mp.weixin.qq.com/s/Nd3q4LKT_rJoMNo-AU-uuw",
  "connect": "https://mp.weixin.qq.com/s/72uvagowsaOaT2r6bUA2sw",
  "map": "https://mp.weixin.qq.com/s/21rcFg3A-4rBOp8lnpxdzw"
}


Component({

  data: {
    url: "",
  },


  methods: {

    onLoad(query?: Record<string, string>) {
      if(!query) return
      const type = query.type
      if(!type) return
      const url = typeToUrl[type as keyof typeof typeToUrl]
      if(!url) return
      this.setData({ url })
    }

  },



  
})