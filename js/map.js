/* 
* @Author: Busy
* @Date:   2018-02-06 10:23:30
* @Last Modified by:   Busy
* @Last Modified time: 2018-02-06 16:34:46
*/

// 点击按钮设置cookie
// setCookie( positionName,false,1);
$(function(){ 
    var UCarMap = function(mapId){
        this.mapId = mapId || null;
    }
    UCarMap.prototype = {
            init: function(){
                var me = this;
                this.createMap.apply(this, arguments);
            },
            zoom: 14,
            createMap: function(options){
                if(!this.mapId){
                    return
                }
                this.map = new BMap.Map(this.mapId, $.extend({enableMapClick: false}, options || { }));
                return this;
            },
            //创建点
            createPoint: function(lat, lng){
                return new BMap.Point(lat,lng);
            },
            zoomOut: function(){
                this.map.zoomOut();
                return this;
            },
            zoomIn: function(){
                this.map.zoomIn();
                return this;
            },
            enableScrollWheelZoom: function(){
                this.map.enableScrollWheelZoom();
                return this;
            },
            enableDragging: function(){
                this.map.enableDragging();
                return this;
            },
            centerAndZoom: function(point, zoom){
                this.map.centerAndZoom(point, zoom || 7);
                return this;
            },
            setMapStyle: function(customStyle){
                this.map.setMapStyle({styleJson:customStyle});
                return this;
            },
            /**
            *创建百度地图坐标点
            * @param lat {Number || Float}
            * @param lng {Number || Float}
            * @return {BMap Point}
            */
            createPt: function(lat, lng){
                return new BMap.Point(lat, lng);
            },
            /**
            *设置新图标
            * @param url {String} 图标地址
            * @param width {Number} 图标宽度
            * @param height {Number} 图标高度
            * @return {MapIcon} 
            *   new BMap.Marker(pt, {icon:myIcon});
            */
            createIcon: function(url, width, height){
                 return new BMap.Icon(url, new BMap.Size(width, height));
            },
            /**
            * 创建marker
            * @param pt {BMap Point}
            * @param icon {MapIcon} icon图标
            *
            */
            createMarker: function(pt, icon, info){
                var marker = new BMap.Marker(pt, {icon: icon})
                marker.ucprops = {}
                $.extend(marker.ucprops, info || {})
                return marker;
            },
            createMarkerByData: function(info, url, width, height){
                return this.createMarker( this.createPt(info.longtitude,info.lat itude), this.createIcon(url, width, height), info )
            },

            //把marker添加到地图并保存起来
            addMarker: function(marker, callback, type){
                if(!marker){
                    return ;
                }
                if(!this.markers){
                    this.markers = []
                }
                this.markers.push(marker);
                this.map.addOverlay(marker);
                if($.isFunction(callback)){
                    marker.addEventListener(type || 'click', function(){
                        callback.apply(this, arguments)
                    })
                }
                
            },
            addMarkerByData: function(info, url, width, height, cb){
                this.addMarker( this.createMarkerByData.apply(this, arguments), function(){
                            cb && cb.apply(this, arguments)
                        } )
            },
            addMarkersByData: function(ary, cb){
                var me = this;
                $.each(ary, function(i, item){
                    me.addMarkerByData(item,
                        me.url, 
                        me.iconW,
                        me.iconH,
                        cb)
                })
            },
            clearMarker: function(flag){
                if(!flag){
                    this.markers = [];
                }
                this.map.clearOverlays();
            },
            getBounds: function(){
                    return this.map.getBounds();   //获取可视区域
            },
            getswne: function(){
                var bs = this.getBounds();
                return {
                    sw: bs.getSouthWest(),//左下角
                    ne: bs.getNorthEast()//右上
                }
            }
    
    }
    
    var station = {
        id: 'map',
        //默认是北京
        defaultsOpts: {
            longtitude: '116.397428',
            latitude: '39.909230',
            zoom: 14
        },
        newMap: function(){
            var me = this;
            me.umap = new UCarMap(this.id);
            me.umap.iconW = 28;
            me.umap.iconH = 32;
            me.umap.url = "../image/icon_positions.png";
            me.umap.init();
            me.baiduMap = me.umap.map;
            return me;

        },
        /**
         * 设置中心点
         * @param opts {Map}
         * @param opts.longtitude {Number String}
         * @param opts.latitude {Number String}
         */
        setMapCenter: function(opts){
            var me = this,
                dft = {}
            dft = $.extend(dft, this.defaultsOpts, opts || {})

            this
                .umap
                .centerAndZoom(new BMap.Point(dft.longtitude, dft.latitude), dft.zoom);
        },
        ary: ['stationId', 'stationName', 'stationAdr', 'stationLat', 'stationLng', 'time', 'cityCode'],
        /**
         * 获取历史网点
         * @param key {String} [stationId | stationName | stationAdr | stationLat | stationLng | time]
         * @return {String} 取对应信息
         */
        getHistoryInfo: function(key){

            return getVal && getVal[key] ? getVal[key] : ''

        },
        getInfos: function(){
            var info = {}, me = this;
            $.each(this.ary, function(index, item){
                info[item] = me.getHistoryInfo(item);
            })
            return info
        },
        //获取历史坐标
        getHistoryCoord: function(){
            var lat = this.getHistoryInfo('stationLat'),
                lng =  this.getHistoryInfo('stationLng');
            if(lat && lng){
                return {
                    longtitude: lng,
                    latitude: lat
                }
            }
            return null;
        },
        getCity: function(cityCode){
            var cities = {
                110000: '北京',
                440100: '广州'
            }
            return cities[cityCode];
        },
        //citycode判断是不是北京
        checkIsBJ: function(cityCode){
            if(!cityCode){
                cityCode = '110000'
            }
            return this.getCity(cityCode) == '北京'
        },
        getLocation: function( callback, errBack ){
            var me = this;
            // 获取当前位置
            try{
                var geolocation = new BMap.Geolocation();
                geolocation.getCurrentPosition(function(r){ 
                    callback.apply(this, arguments);         
                }, {enableHighAccuracy: true})//指示浏览器获取高精度的位置，默认false
            }catch(error){
                console.log(error.message);
                if($.isFunction(errBack)){
                    errBack.apply(this, arguments);
                }
            }
        },
        currentCity: '北京',
        setLocation: function(success, error){
            var me = this;
            me.getLocation(function(r){
                    var locationCityName = r.address.city;
                    //如果跟定位的城市跟传过来的城市不一样，不用重新定位
                    if( locationCityName.indexOf(me.currentCity) != -1){

                        if(this.getStatus() == BMAP_STATUS_SUCCESS){  
                            //以指定的经度与纬度创建一个坐标点  
                            var station = {
                                latitude: r.point.lat,
                                longtitude: r.point.lng
                            };
                            //定位打点
                            // me.umap.clearMarker(true);
                            me.umap.addMarkerByData(station, '../image/icon_location.png' ,23 , 23)

                            me.setMapCenter($.extend({}, station, {zoom: 14}));
                            if($.isFunction(success)){
                                success.apply(this, arguments);
                            }
                            
                        }  
                        else {  
                            ycTips('定位失败');  
                            if($.isFunction(error)){
                                error.apply(this, arguments);
                            }
                        }

                    }else{
                        me.loadFn(me.phoneLat, me.phoneLont);
                    }
                })
        },
        $el: $('.positionBox'),
        $: function(selector){
            return selector? $(selector, this.$el) : this.$el;
        },
        setStation: function(infos){
            //$('.positionBox').show();
            var me = this;
            me.$().show();
            me.$('.positionName').text(infos.stationName);
            me.$('.positionAdr').text(infos.stationAdr);
            me.$('.js_btn').attr('stationid', infos.stationId);

            var str = [
                'rentCar.html?stationId=' + infos.stationId, 
                '&stationName=' + infos.stationName,
                '&stationAdr=' + infos.stationAdr,
                '&stationLat=' + infos.stationLat,
                '&stationLng=' + infos.stationLng,
                '&time=' + infos.time,
                '&cityCode=' + infos.cityCode,
            ].join('')
            me.$('.js_btn').attr('href', str);
        },
        getNearlyStation: function(leftbtm, rightTop, phoneLat, phoneLont, hasHistoryStation ){
            var me = this;
            var infos = me.getInfos();
            var reqData = {
                        phoneLat: phoneLat,
                        phoneLont: phoneLont,
                        leftLat: rightTop.lat,
                        leftLont: leftbtm.lng,
                        rightLat: leftbtm.lat,
                        rightLont: rightTop.lng,
                        cityCode: infos.cityCode || '110000'
                    }
            service.getNearlyStations(
                reqData,
                function(data){
                    if(!data){
                        ycTips('出错啦，请稍后再试！');
                        return ;
                    }
                    if( data.ret != 0 ){
                        return;
                    }
                    if(!data.content || !data.content[0]){
                        //ycTips(data.msg || '出错啦，请稍后再试！');
                        return;
                    }
                    if(hasHistoryStation != 'disable'){
                        var nearlyStationLat = hasHistoryStation? phoneLat: data.content[0].latitude;
                        var nearlyStationLnt = hasHistoryStation? phoneLont: data.content[0].longtitude;
                        // initMap.umap.clearMarker(true);
                        me.setMapCenter({
                            latitude: nearlyStationLat,
                            longtitude: nearlyStationLnt,
                            zoom: 14
                        })
                    }
                    
                    if(hasHistoryStation == 'disable'){
                        me.umap.clearMarker();
                    }
                    me.umap.addMarkersByData( data.content, function(){
                        var item = this.ucprops;
                        me.setStation({
                            cityCode: me.getHistoryInfo('cityCode'),
                            time: me.getHistoryInfo('time'),
                            stationId: item.stationId,
                            stationName: item.stationName,
                            stationAdr: item.stationAddress,
                            stationLat: item.latitude,
                            stationLng: item.longtitude 
                        })
                    });
                },
                function(data){
                    ycTips('出错啦，请稍后再试！');
                }
            )
        },
        loadFn: function(phoneLat, phoneLont, hasHistoryStation){
            var me = this;
            if(!me.umap){
                return;
            }
            var coord = me.umap.getswne()
            var leftbtm = coord.sw;
            var rightTop = coord.ne;
            me.getNearlyStation(leftbtm, rightTop, phoneLat, phoneLont, hasHistoryStation );
            //me.map.removeEventListener('tilesloaded',loaded);
        },
        bindEvent: function(){
            var me = this;
            var timer = null;
            if(me.baiduMap){
                function service(){
                    var leftbtm = me.umap.getswne().sw;
                    var rightTop = me.umap.getswne().ne;
                    me.getNearlyStation(leftbtm, rightTop, me.phoneLat, me.phoneLont, 'disable');
                    timer = null;
                }
                me.baiduMap.addEventListener('dragend', function(){
                    // console.log(umap.getswne())
                    var that = this;
                    if(timer){
                        clearTimeout(timer);
                        timer = null;
                    }
                    timer = setTimeout(function(){
                        service.apply(this, arguments);
                    }, 100)

                });
                me.baiduMap.addEventListener('zoomend', function(){
                    // console.log(umap.getswne())
                    var that = this;
                    if(timer){
                        clearTimeout(timer);
                        timer = null;
                    }
                    timer = setTimeout(function(){
                        service.apply(this, arguments); 
                    }, 100)

                });
            }
        },
        init: function(){
            var me = this, 
                center = {
                    longtitude: me.defaultsOpts.longtitude,
                    latitude: me.defaultsOpts.latitude
                };
            //首先实例化地图
            me.newMap();

            var historyStation = me.getHistoryCoord();
            if(me.checkIsBJ( me.getHistoryInfo('cityCode') )){ //北京
                me.setMapCenter( historyStation );
                me.currentCity = '北京'
            } else { //广州
                me.setMapCenter( $.extend( {}, 
                    {
                        longtitude: '113.233330',
                        latitude: '23.166670',
                    },
                    historyStation || {} ) )
                me.currentCity = '广州';
                center = {
                    longtitude: '113.233330',
                    latitude: '23.166670',
                }
            }   
                me.phoneLat = center.latitude
                me.phoneLont = center.longtitude
            //判断是否请求当前定位    
            if( !(historyStation && historyStation.longtitude) ){
                try{
                    me.setLocation(function(r){
                        me.loadFn(r.point.lat, r.point.lng);

                        me.phoneLat = r.point.lat
                        me.phoneLont = r.point.lng
                    }, 
                    function(){
                        me.loadFn(center.latitude, center.longtitude);
                    })
                } catch(e){}
            } else {
                
                me.loadFn(historyStation.latitude, historyStation.longtitude, true);
            }
            var infos = me.getInfos()
            if(infos && infos.stationId){
                me.setStation(infos);
            }
            me.bindEvent()
        }
    }

 station.init()



})