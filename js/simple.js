// 初始化插件
// 全局保存当前选中窗口
var g_iWndIndex = 0; //可以不用设置这个变量，有窗口参数的接口中，不用传值，开发包会默认使用当前选择窗口
var deviceIP;
var devicePort="80";
var deviceUserName="admin";
var devicePwd="hik12345+";
var _indexID=-1;
var szInfo;

function viewload(ip){
	
	if (!ip) {
		alert("请选择要显示的监控点！");
		return;
	}
	deviceIP = ip;
//$(function () {
	// 检查插件是否已经安装过
    var iRet = WebVideoCtrl.I_CheckPluginInstall();
	if (-2 == iRet) {
		alert("您的Chrome浏览器版本过高，不支持NPAPI插件！");
		return;
	} else if (-1 == iRet) {
		document.write("<a href='http://59.55.128.155:8000/XNH3D/Resources/WebComponentsKit.exe'>未检测到WebComponentsKit插件，请单击此处下载并安装插件。</a >");
//      alert("<p>您还未安装过插件，双击开发包目录里的WebComponentsKit.exe安装");
		return;
    }
	
	// 初始化插件参数及插入插件
	WebVideoCtrl.I_InitPlugin(deviceViewWidth, deviceViewHeight, {
        bWndFull: true,//是否支持单窗口双击全屏，默认支持 true:支持 false:不支持
        iWndowType: 1,
		cbSelWnd: function (xmlDoc) {
			g_iWndIndex = $(xmlDoc).find("SelectWnd").eq(0).text();
			var szInfo = "当前选择的窗口编号：" + g_iWndIndex;
		}
	});
	WebVideoCtrl.I_InsertOBJECTPlugin("divPlugin");

	// 检查插件是否最新
	if (-1 == WebVideoCtrl.I_CheckPluginVersion()) {
		alert("检测到新的插件版本，双击开发包目录里的WebComponentsKit.exe升级！");
		return;
	}

	// 窗口事件绑定
	$(window).bind({
		resize: function () {
			var $Restart = $("#restartDiv");
			if ($Restart.length > 0) {
				var oSize = getWindowSize();
				$Restart.css({
					width: oSize.width + "px",
					height: oSize.height + "px"
				});
			}
		}
	});

    //初始化日期时间
    var szCurTime = dateFormat(new Date(), "yyyy-MM-dd");
    $("#starttime").val(szCurTime + " 00:00:00");
    $("#endtime").val(szCurTime + " 23:59:59");
    
    setTimeout(function () {
				clickLogin();//登入
			}, 100);
	setTimeout(function () {
				clickStartRealPlay();//播放
			}, 500);
};

// 显示操作信息
function showOPInfo(szInfo) {
	szInfo = "<div>" + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + " " + szInfo + "</div>";
	$("#opinfo").html(szInfo);
}

// 格式化时间
function dateFormat(oDate, fmt) {
	var o = {
		"M+": oDate.getMonth() + 1, //月份
		"d+": oDate.getDate(), //日
		"h+": oDate.getHours(), //小时
		"m+": oDate.getMinutes(), //分
		"s+": oDate.getSeconds(), //秒
		"q+": Math.floor((oDate.getMonth() + 3) / 3), //季度
		"S": oDate.getMilliseconds()//毫秒
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (oDate.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
}

// 获取窗口尺寸
function getWindowSize() {
	var nWidth = $(this).width() + $(this).scrollLeft(),
		nHeight = $(this).height() + $(this).scrollTop();

	return {width: nWidth, height: nHeight};
}

// 打开选择框 0：文件夹  1：文件
function clickOpenFileDlg(id, iType) {
	var szDirPath = WebVideoCtrl.I_OpenFileDlg(iType);
	
	if (szDirPath != -1 && szDirPath != "" && szDirPath != null) {
		$("#" + id).val(szDirPath);
	}
}

// 登录
function clickLogin() {
	var szIP = deviceIP,
		szPort = devicePort,
		szUsername = deviceUserName,
		szPassword = devicePwd;
	if ("" == szIP || "" == szPort) {
		return;
	}

	var iRet = WebVideoCtrl.I_Login(szIP, 1, szPort, szUsername, szPassword, {
		success: function (xmlDoc) {
			showOPInfo(szIP + " 登录成功！");
			
			setTimeout(function () {
				getChannelInfo();
			}, 10);
		},
		error: function () {
			showOPInfo(szIP + " 登录失败！");
		}
	});

	if (-1 == iRet) {
		showOPInfo(szIP + " 已登录过！");
	}
}
// 退出
function clickLogout() {
	var szIP = deviceIP;
	if (szIP == "") {
		return;
	}

	var iRet = WebVideoCtrl.I_Logout(szIP);
	if (0 == iRet) {
		getChannelInfo();
		_indexID=-1;
	} else {
		//退出失败！
	}
	showOPInfo(szIP + " " + szInfo);
}
// 获取通道
function getChannelInfo() {
	var szIP = deviceIP,judge=false,oSel = $("#channels").empty();

	if ("" == szIP) {
		return;
	}
	
	// 模拟通道
	WebVideoCtrl.I_GetAnalogChannelInfo(szIP, {
		async: false,
		success: function (xmlDoc) {
			var oChannels = $(xmlDoc).find("VideoInputChannel");

			$.each(oChannels, function (i) {
				_indexID=parseInt($(this).find("id").eq(0).text(), 10);
			});
			showOPInfo(szIP + " 获取模拟通道成功！");
			judge =true;
		},
		error: function () {
			showOPInfo(szIP + " 获取模拟通道失败！");
		}
	});
	if(judge){return;}
	// 数字通道
	WebVideoCtrl.I_GetDigitalChannelInfo(szIP, {
		async: false,
		success: function (xmlDoc) {
			var oChannels = $(xmlDoc).find("InputProxyChannelStatus");

			$.each(oChannels, function (i) {
				_indexID=parseInt($(this).find("id").eq(0).text(), 10);
			});
			showOPInfo(szIP + " 获取数字通道成功！");
			judge =true;
		},
		error: function () {
			showOPInfo(szIP + " 获取数字通道失败！");
		}
	});
	if(judge){return;}
	// 零通道
	WebVideoCtrl.I_GetZeroChannelInfo(szIP, {
		async: false,
		success: function (xmlDoc) {
			var oChannels = $(xmlDoc).find("ZeroVideoChannel");
			
			$.each(oChannels, function (i) {
				_indexID=parseInt($(this).find("id").eq(0).text(), 10);
			showOPInfo(szIP + " 获取零通道成功！");
			judge =true;
			});
		},
		error: function () {
			showOPInfo(szIP + " 获取零通道失败！");
		}
	});
}

// 开始预览
function clickStartRealPlay() {
	var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex),
		szIP = deviceIP,
		iStreamType = 1,
		iChannelID = _indexID,
		bZeroChannel = false,
		szInfo = "";

	if ("" == szIP) {
		return;
	}

	if (oWndInfo != null) {// 已经在播放了，先停止
		WebVideoCtrl.I_Stop();
	}

	var iRet = WebVideoCtrl.I_StartRealPlay(szIP, {
		iStreamType: iStreamType,
		iChannelID: iChannelID,
		bZeroChannel: bZeroChannel
	});

	if (0 == iRet) {
		szInfo = "开始预览成功！";
	} else {
		szInfo = "开始预览失败！";
	}

	showOPInfo(szIP + " " + szInfo);
}

// 停止预览
function clickStopRealPlay() {
	var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex),
		szInfo = "";

	if (oWndInfo != null) {
		var iRet = WebVideoCtrl.I_Stop();
		if (0 == iRet) {
			szInfo = "停止预览成功！";
		} else {
			szInfo = "停止预览失败！";
		}
		showOPInfo(oWndInfo.szIP + " " + szInfo);
	}
}

// 全屏
function clickFullScreen() {
	WebVideoCtrl.I_FullScreen(true);
}
//退出前执行
function CloseIt()
{
    if(_indexID!=-1){
    	clickLogout();
    }
}
