# Git 上传与协作通用规则



本文档用于约定项目中的 Git 分支、提交、同步、合并和上传流程。

可复制到不同项目中使用；如项目有特殊要求，以项目 README、CI 配置、团队约定或代码托管平台规则为准。



当用户或协作者要求：



```text

完成任务并上传

按规则上传

提交到远程仓库

按 docs/GIT_UPLOAD_RULES.md 提交并推送

```



默认按照本文档执行。



---



## 一、基本原则



1. 先检查仓库状态，再开始修改或提交。

2. 不直接在 `main` / `master` 上开发普通功能。

3. 普通任务从最新的集成分支创建任务分支。

4. 一个分支对应一个清晰任务，不混入无关修改。

5. 提交前必须检查 diff，确认只包含本次任务内容。

6. 推送前尽量运行项目可用的测试、构建或检查命令。

7. 不自动执行会丢失代码、改写历史或删除远程内容的危险操作。



---



## 二、常见分支模型



推荐使用以下通用分支模型：



| 分支 | 用途 | 规则 |

| --- | --- | --- |

| `main` 或 `master` | 稳定分支 / 发布分支 | 只接收已经验证稳定的代码，不直接开发普通任务 |

| `dev` 或 `develop` | 开发集成分支 | 日常开发和普通修复优先在这里完成，再统一验证 |

| `feature/*` | 新功能分支 | 新增完整功能、入口、交互或业务能力 |

| `fix/*` | 修复分支 | 注意项目普通 Bug 修复不再新开此类分支；仅历史分支清理或特殊约定时保留 |

| `hotfix/*` | 紧急修复分支 | 只用于必须直接修复稳定分支的线上紧急问题 |

| `docs/*` | 文档分支 | README、规则、说明、设计文档等修改 |

| `refactor/*` | 重构分支 | 不改变外部行为的代码结构调整 |

| `test/*` | 测试分支 | 只补充或调整测试 |

| `chore/*` | 工程维护分支 | 依赖、构建、脚本、配置、仓库维护 |

| `backup/*` | 备份分支 | 只作为临时安全备份，不用于日常开发或合并 |



如果项目没有 `dev` / `develop`，可从项目指定的默认开发分支创建任务分支。



---



## 三、开始任务前



先检查当前分支和工作区：



```bash

git status

git branch --show-current

```



如果工作区已有未提交修改，先判断来源：



1. 属于当前任务：继续在当前任务分支完成并提交。

2. 属于其他任务：不要混入本次提交，必要时先暂存或切换到对应分支处理。

3. 来源不明：停止提交，先确认这些修改是否应该保留。



普通任务建议从最新开发集成分支创建：



```bash

git switch dev

git pull --ff-only origin dev

git switch -c feature/用户登录

```



普通 Bug 修复任务：



```bash

git switch dev

git pull --ff-only origin dev

```



说明：当前项目约定普通 Bug 修复尽量不新开 `fix/*` 分支！！！，直接在 `dev` 上完成、测试、提交；稳定后再同步到 `master`。



文档任务：



```bash

git switch dev

git pull --ff-only origin dev

git switch -c docs/更新上传规则

```



如项目使用 `develop`，将以上命令中的 `dev` 替换为 `develop`。



---



## 四、分支命名规则



推荐格式：



```text

类型/任务编号-简短中文名称

```



没有任务编号时：



```text

类型/简短中文名称

```



推荐示例：



```text

feature/用户登录

feature/123-导出报表

fix/修复登录超时

fix/456-修复空状态崩溃

docs/更新上传规则

refactor/重构接口客户端

test/订单服务用例

chore/更新CI配置

```



命名要求：



1. 分支名称以简短中文为主，可用小写英文、数字和 `-` 辅助。

2. 不使用空格、下划线或特殊符号。

3. 名称描述任务目标，不写过长实现细节。

4. 避免含糊名称，例如 `fix/修复`、`feature/新增`、`update/更新`、`test1`。

5. 同一个未完成任务继续使用原分支，不重复创建 `-2`、`again`、`new` 之类分支。

> 提示：Git 原生支持中文分支名；如项目 CI 脚本或托管平台对中文支持不佳，可退化为拼音或英文。



---



## 五、提交信息规则



提交信息优先使用中文，格式为：



```text

类型：简短说明

```



常用类型：



| 类型 | 场景 | 示例 |

| --- | --- | --- |

| `功能：` | 新增功能 | `功能：新增 XML 检查入口` |

| `修复：` | 修复 Bug | `修复：完善参考文献检查` |

| `文档：` | 文档修改 | `文档：更新 Git 上传规则` |

| `重构：` | 代码重构 | `重构：拆分网页抓取模块` |

| `测试：` | 测试修改 | `测试：补充参考文献检查用例` |

| `维护：` | 构建、依赖、脚本、配置 | `维护：更新打包脚本配置` |

| `优化：` | 性能优化 | `优化：减少网页等待时间` |

| `格式：` | 不影响逻辑的格式调整 | `格式：整理导出表格样式` |



不推荐：



```text

修复：更新

修复：改代码

维护：杂项

```



推荐：



```text

修复：完善参考文献检查

功能：新增 XML 检查入口

文档：更新 Git 上传规则

```



---



## 六、开发与提交流程



完成一个清晰阶段后，可以提交：



```bash

git status

git diff

git add path/to/file1 path/to/file2

git diff --cached

git commit -m "类型：简短说明"

```



优先明确指定文件：



```bash

git add src/module.ts tests/module.test.ts

```



只有确认工作区全部修改都属于当前任务时，才使用：



```bash

git add .

```



提交前确认：



1. 不包含其他任务的修改。

2. 不包含临时文件、日志、构建产物或本地配置。

3. 不包含密钥、密码、Token、证书等敏感信息。

4. 不包含无关格式化。

5. 没有误删或误改已有功能。



首次推送当前分支：



```bash

git push -u origin 当前分支名

```



后续继续推送：



```bash

git push

```



---



## 七、测试与检查



推送或创建合并请求前，按项目实际情况运行可用命令，例如：



```bash

npm test

npm run lint

npm run build

```



或：



```bash

pnpm test

pnpm lint

pnpm build

```



或：



```bash

pytest

go test ./...

mvn test

gradle test

```



原则：



1. 项目存在什么检查命令，就运行对应命令。

2. 不存在的命令不强行执行。

3. 测试失败时，不应直接当作已完成上传。

4. 如果因环境缺失无法运行测试，需要在结果说明中写清楚。



---



## 八、合并前同步最新开发分支



创建或更新合并请求前，先获取远程最新状态：



```bash

git fetch origin

git status

git branch --show-current

```



如果当前任务分支落后于开发集成分支，建议在当前任务分支执行：



```bash

git merge origin/dev

```



如项目使用 `develop`：



```bash

git merge origin/develop

```



这表示把最新开发分支合并到当前任务分支中，不是用开发分支覆盖当前任务代码。



同步后重新运行相关检查：



```bash

npm test

npm run lint

npm run build

```



通过后推送：



```bash

git push

```



然后创建或更新合并请求：



```text

当前任务分支 -> dev / develop

```



---



## 九、冲突处理



出现冲突时，在当前任务分支解决，不直接在 `dev` / `develop` 上临时修改。



查看冲突状态：



```bash

git status

```



手动编辑冲突文件，删除冲突标记：



```text

  <<<<<<<

  =======

  >>>>>>>

```



解决后：



```bash

git add 冲突文件

git commit -m "chore: merge latest dev"

```



再运行测试和检查：



```bash

npm test

npm run lint

npm run build

```



通过后推送：



```bash

git push

```



冲突解决原则：



1. 保留开发分支中已经合并的正确功能。

2. 保留当前任务分支的业务目标。

3. 不机械选择“接受当前”或“接受传入”。

4. 以最终正确行为为准整理代码。

5. 解决后必须重新检查和测试。



---



## 十、多个并行分支的合并顺序



多个任务分支同时从旧版开发分支创建时，应按顺序逐个合并。



示例：



```text

feature/用户登录

fix/修复登录超时

docs/更新上传规则

```



推荐流程：



```text

feature/用户登录 合并到 dev

fix/修复登录超时 同步最新 dev，解决冲突并测试，再合并到 dev

docs/更新上传规则 再同步最新 dev，解决冲突并测试，再合并到 dev

```



每当一个分支合并进开发分支后，后续待合并分支都应重新执行：



```bash

git fetch origin

git merge origin/dev

```



---



## 十一、修改已经推送的代码



### 原任务还没有合并



继续使用原任务分支：



```bash

git switch feature/用户登录

```



修改后：



```bash

git status

git diff

git add 本次相关文件

git commit -m "修复：简短说明"

git push

```



原合并请求会随分支更新，不需要重新创建分支或合并请求。



### 原任务已经合并



如果原任务已合并到 `dev` / `develop`，后来发现普通 Bug，当前项目优先直接回到最新 `dev` 修复：



```bash

git switch dev

git pull --ff-only origin dev

```



完成后提交并推送：



```bash

git add 本次相关文件

git commit -m "修复：简短说明"

git push origin dev

```



只有紧急线上修复或团队明确要求隔离风险时，才创建 `hotfix/*` 或其他临时分支。



---



## 十二、稳定分支发布



普通功能和修复优先进入开发集成分支：



```text

任务分支 -> dev / develop

```



当开发集成分支测试稳定后，再创建：



```text

dev / develop -> main / master

```



合并到稳定分支前确认：



1. 相关测试已经通过。

2. 多个功能整合后行为正常。

3. 没有未解决冲突。

4. 没有调试代码、临时文件或本地配置。

5. 没有敏感信息。

6. 构建或发布检查正常。



---



## 十三、Hotfix 紧急修复



`hotfix/*` 只用于必须直接修复稳定分支的紧急问题。



从最新稳定分支创建：



```bash

git switch main

git pull --ff-only origin main

git switch -c hotfix/修复紧急问题

```



修复、测试并推送：



```bash

git add 本次相关文件

git commit -m "修复：简短说明"

git push -u origin hotfix/修复紧急问题

```



创建合并请求：



```text

hotfix/修复紧急问题 -> main / master

```



Hotfix 合并到稳定分支后，必须同步回开发集成分支，避免长期分支内容不一致：



```text

main / master -> dev / develop

```



---



## 十四、协作助手默认执行规则



当用户要求“完成任务并上传”时，协作助手默认执行：



1. 检查 `git status` 和当前分支。

2. 判断当前任务是否已有对应分支。

3. 同一未完成任务继续使用原分支。

4. 新任务从最新开发集成分支创建合适任务分支。

5. 不直接在 `main` / `master` / `dev` / `develop` / `backup/*` 上开发普通任务。

6. 完成代码或文档修改。

7. 运行项目可用的测试、构建或检查命令。

8. 查看 `git diff`，确认只包含本次任务修改。

9. 优先添加明确文件，不默认无条件执行 `git add .`。

10. 使用规范提交信息提交。

11. 推送当前任务分支到远程仓库。

12. 创建合并请求前获取远程最新状态。

13. 如分支落后，先合并最新开发分支并解决冲突。

14. 冲突解决后重新运行测试。

15. 推送同步后的任务分支。

16. 告诉用户应创建或更新的合并请求方向。

17. 不自动合并到稳定分支。

18. 不在后台自动监听文件变化或自动上传。



发现以下情况时，应停止并说明：



1. 工作区存在来源不明的修改。

2. 当前分支与任务明显不匹配。

3. 测试失败。

4. 合并冲突无法根据业务规则可靠判断。

5. 即将提交敏感信息。

6. 需要执行危险操作。



---



## 十五、必须先确认的危险操作



以下操作不会自动执行，必须先说明风险并得到明确确认：



```bash

git reset --hard

git clean -fd

git checkout -- 文件名

git restore 文件名

git push --force

git push --force-with-lease

git rebase 已推送的公共分支

git branch -D 分支名

git push origin --delete 分支名

git push origin --delete main

git push origin --delete master

git push origin --delete dev

git push origin --delete develop

git push origin --delete backup/分支名

```



以下行为同样需要先确认：



1. 丢弃未提交修改。

2. 删除本地或远程分支。

3. 改写已经推送的提交历史。

4. 强制覆盖远程代码。

5. 使用 `reset` 将当前分支变成其他分支状态。

6. 跳过失败的测试直接上传。

7. 将普通任务直接合并到稳定分支。



---



## 十六、推荐口令



```text

按 Git 上传规则完成这个任务并上传。

```



```text

继续在当前任务分支完善，完成后按规则提交并推送。

```



```text

这个功能做好后，按 docs/GIT_UPLOAD_RULES.md 提交并推送。

```



```text

先同步最新 dev / develop，解决冲突并测试，不要覆盖当前分支代码。

```



```text

只提交本次任务相关文件，不要提交其他改动。

```
