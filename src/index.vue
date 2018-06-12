<template>
  <div class="app-container calendar-list-container">
    <div class="filter-container" style="margin: 10px;">
      <el-input @keyup.enter.native="handleFilter" style="width: 200px;" class="filter-item" placeholder="" v-model="listQuery.username">
      </el-input>
      <el-button class="filter-item" type="primary" icon="search" @click="handleFilter" style="padding:10px 15px;">搜索</el-button>
      <el-button v-if="sys_user_add" class="filter-item" style="margin-left:10px;padding:10px 15px;" @click="handleCreate" type="primary" icon="edit">添加</el-button>
    </div>

    <el-table :span-method="objectSpanMethod" :key='tableKey' :data="testlist" v-loading="listLoading" element-loading-text="给我一点时间" border fit highlight-current-row style="width: 99%">
      <el-table-column align="center" prop="authorizeId" label="ID"></el-table-column>
      <el-table-column align="center" prop="companyNo" label="企业编号"></el-table-column>
      <el-table-column align="center" prop="companyName" label="企业名称"></el-table-column>
      <el-table-column align="center" label="权限群组标识" prop="groupId" show-overflow-tooltip></el-table-column>
      <el-table-column align="center" prop="groupName" label="权限群组名称"></el-table-column>
      <el-table-column align="center" label="创建时间">
        <template slot-scope="{row}">
          <span>{{row.createTime | formatDate}}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="updateTime" label="修改时间">
        <template slot-scope="{row}">
          <span>{{row.updateTime | formatDate}}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="200">
        <template slot-scope="{row}">
          <el-button v-if="sys_user_upd" size="small" type="success" @click="handleUpdate(row)">编辑
          </el-button>
          <el-button v-if="sys_user_del" size="small" type="danger" @click="deletes(row)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-show="!listLoading" class="pagination-container">
      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page.sync="listQuery.page" :page-sizes="[10,20,30, 50]" :page-size="listQuery.limit" layout="total, sizes, prev, pager, next, jumper" :total="total">
      </el-pagination>
    </div>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogDeptVisible">
      <el-tree class="filter-tree" :data="treeDeptData" :default-checked-keys="checkedKeys" check-strictly node-key="id" highlight-current ref="deptTree" :props="defaultProps" @node-click="getNodeData" default-expand-all>
      </el-tree>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输用户名"></el-input>
        </el-form-item>

        <el-form-item v-if="dialogStatus == 'create'" label="密码" placeholder="请输入密码" prop="newpassword1">
          <el-input type="password" v-model="form.newpassword1"></el-input>
        </el-form-item>

        <el-form-item label="所属部门" prop="deptName">
          <el-input v-model="form.deptName" placeholder="选择部门" @focus="handleDept()" readonly></el-input>
          <input type="hidden" v-model="form.deptId" />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select class="filter-item" v-model="role" placeholder="请选择" multiple>
            <el-option v-for="item in rolesOptions" :key="item.roleId" :label="item.roleDesc" :value="item.roleId" :disabled="isDisabled[item.delFlag]">
              <span style="float: left">{{ item.roleDesc }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.roleCode }}</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="验证码登录使用"></el-input>
        </el-form-item>

        <el-form-item label="状态" v-if="dialogStatus == 'update' && sys_user_del " prop="delFlag">
          <el-select class="filter-item" v-model="form.delFlag" placeholder="请选择">
            <el-option v-for="item in statusOptions" :key="item" :label="item | statusFilter" :value="item"> </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel('form')">取 消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="create('form')">确 定</el-button>
        <el-button v-else type="primary" @click="update('form')">修 改</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ElRadioGroup from 'element-ui/packages/radio/src/radio-group'
import ElOption from 'element-ui/packages/select/src/option'
import { pageCompanyByAdmin, filterCompanyByAdmin } from '../../api/company.js'
import Mergecol from '@/utils/Mergecol.js'

export default {
  components: {
    ElOption,
    ElRadioGroup
  },
  name: 'table_user',
  data() {
    return {
      treeDeptData: [],
      checkedKeys: [],
      companyMergeList: [],
      companyMergeId: [],
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      testlist: [
        { authorizeId: 'preset_company_authorize_0', companyName: '人和数据', companyNo: 'c1', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_1', companyName: '人和数据', companyNo: 'c1', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_2', companyName: '致远数据', companyNo: 'c2', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_3', companyName: '致远数据', companyNo: 'c2', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_4', companyName: '大大数据', companyNo: 'c3', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_5', companyName: '这是什么', companyNo: 'c3', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_6', companyName: '这是什么', companyNo: 'c3', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_7', companyName: '这是什么', companyNo: 'c4', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_8', companyName: '我是数据', companyNo: 'c5', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' },
        { authorizeId: 'preset_company_authorize_9', companyName: '我是数据', companyNo: 'c5', createTime: '2018-06-08 11:19:30.0', groupId: null, groupName: null, updateTime: '2018-06-08 11:19:30.0' }
      ],
      list: null,
      total: null,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20
      },
      role: [],
      form: {
        username: undefined,
        newpassword1: undefined,
        delFlag: undefined,
        deptId: undefined,
        phone: undefined
      },
      rules: {
        username: [
          {
            required: true,
            message: '请输入账户',
            trigger: 'blur'
          },
          {
            min: 3,
            max: 20,
            message: '长度在 3 到 20 个字符',
            trigger: 'blur'
          }
        ],
        newpassword1: [
          {
            required: true,
            message: '请输入密码',
            trigger: 'blur'
          },
          {
            min: 5,
            max: 20,
            message: '长度在 5 到 20 个字符',
            trigger: 'blur'
          }
        ],
        deptId: [
          {
            required: true,
            message: '请选择部门',
            trigger: 'blur'
          }
        ],
        role: [
          {
            required: true,
            message: '请选择角色',
            trigger: 'blur'
          }
        ],
        phone: [
          {
            required: true,
            message: '手机号',
            trigger: 'blur'
          },
          {
            min: 11,
            max: 11,
            message: '长度在11 个字符',
            trigger: 'blur'
          }
        ]
      },
      statusOptions: ['0', '1'],
      rolesOptions: [],
      dialogFormVisible: false,
      dialogDeptVisible: false,
      userAdd: false,
      userUpd: false,
      userDel: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '创建'
      },
      isDisabled: {
        0: false,
        1: true
      },
      tableKey: 0
    }
  },
  computed: {
    ...mapGetters(['permissions'])
  },
  filters: {
    statusFilter(status) {
      const statusMap = {
        '0': '未启用',
        '1': '正常',
        '-1': '删除'
      }
      return statusMap[status]
    },
    formatDate(date) {
      if (typeof date === 'string' && date.length > 16) return date.slice(0, 16)
      else return '获取时间失败'
    }
  },
  created() {
    this.getList()
    this.sys_user_add = true
    this.sys_user_upd = true
    this.sys_user_del = true
  },
  methods: {
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      // this.packMergeCol(2, this.companyMergeList)
      let list = this.companyMergeList
      let listi = this.companyMergeId
      let roswIndex = 0
      let rosiIndex = 0
      // columnIndex合并列位置
      if (columnIndex === 2) {
        for (const rosw of list) {
          if (row.companyName === rosw.name) {
            if (rowIndex === roswIndex) {
              return {
                rowspan: rosw.num,
                colspan: 1
              }
            } else {
              return {
                rowspan: 0,
                colspan: 0
              }
            }
          }
          roswIndex = roswIndex + rosw.num
        }
      }
      // 合并企业编号
      if (columnIndex === 1) {
        for (const rosi of listi) {
          if (row.companyNo === rosi.name) {
            if (rowIndex === rosiIndex) {
              return {
                rowspan: rosi.num,
                colspan: 1
              }
            } else {
              return {
                rowspan: 0,
                colspan: 0
              }
            }
          }
          rosiIndex = rosiIndex + rosi.num
        }
      }
    },
    getList() {
      this.$apollo.query({
        query: pageCompanyByAdmin,
        variables: {
          token: this.$store.state.user.token,
          pageNo: this.listQuery.page,
          pageSize: this.listQuery.limit
        }
      }).then(res => {
        // console.log(res)
        this.listLoading = false
        let adata = res.data
        if (adata !== null) {
          this.list = adata.pageCompanyByAdmin.pageRows
          // 根据数据合成需要的控制合并列的数据
          // this.companyMergeList = this.packMergeList(this.testlist)
          // this.companyMergeId = this.packMergeList(this.testlist, 'companyNo')
          let mergecol = new Mergecol(this.testlist)
          this.companyMergeList = mergecol.packMergeList()
          this.companyMergeId = mergecol.packMergeList('companyNo')
        } else {

        }
      }).catch((err) => {
        this.listLoading = false
        console.error(err)
      }
      )
    },
    getListByFilter() {
      this.$apollo.query({
        query: filterCompanyByAdmin,
        variables: {
          token: this.$store.state.user.token,
          key: this.listQuery.username,
          pageNo: this.listQuery.page,
          pageSize: this.listQuery.limit
        }
      }).then(res => {
        console.log(res)
        this.listLoading = false
        var adata = res.data
        if (adata !== null) {
          this.list = adata.filterCompanyByAdmin.pageRows
        } else {

        }
      }).catch((err) => {
        this.listLoading = false
        console.log('bbbbbbbbbb')
        console.log(err)
      }
      )
    },
    getNodeData(data) {
      alert('getNodeData')
    },
    handleDept() {
      alert('handleDept')
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getListByFilter()
    },
    handleSizeChange(val) {
      console.log(val)
      console.log(this.listQuery.page)
      this.listQuery.limit = val
      this.getList()
    },
    handleCurrentChange(val) {
      this.listQuery.page = val
      this.getList()
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
    },
    handleUpdate(row) {
      alert('修改1')
    },
    create(formName) {
      alert('创建1')
    },
    cancel(formName) {
      this.dialogFormVisible = false
      this.$refs[formName].resetFields()
    },
    update(formName) {
      alert('修改')
    },
    deletes(row) {
      alert('删除')
    },
    resetTemp() {
      this.form = {
        id: undefined,
        username: '',
        password: '',
        role: [],
        delFlag: '',
        deptId: '',
        phone: ''
      }
    }
  }
}
</script>
